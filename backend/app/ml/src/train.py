"""
ML Model Training & Progression Pipeline for GigScore.
Trains Logistic Regression (baseline), Random Forest, and calibrated XGBoost.
Evaluates metrics (ROC-AUC, PR-AUC, Calibration, Brier score) and saves production artifacts.
"""
import os
import json
import joblib
import shutil
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    log_loss,
    classification_report,
    confusion_matrix
)
from xgboost import XGBClassifier

from ingestion import generate_synthetic_training_dataset
from features import MODEL_FEATURE_NAMES

def train_all_models():
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    reports_dir = os.path.join(os.path.dirname(__file__), "..", "reports")
    backend_artifacts_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "backend", "app", "ml", "artifacts")
    )
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs(backend_artifacts_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, "synthetic_loan_data.csv")
    if not os.path.exists(csv_path):
        print("Generating synthetic loan dataset...")
        df = generate_synthetic_training_dataset(2500)
        df.to_csv(csv_path, index=False)
    else:
        df = pd.read_csv(csv_path)
        
    X = df[MODEL_FEATURE_NAMES]
    y = df["target_default"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"Dataset summary: Train size={len(X_train)}, Test size={len(X_test)}, Positive default rate={y.mean():.2%}")
    
    # 1. Baseline: Logistic Regression
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    lr_model = LogisticRegression(class_weight="balanced", random_state=42, max_iter=1000)
    lr_model.fit(X_train_scaled, y_train)
    lr_preds_prob = lr_model.predict_proba(X_test_scaled)[:, 1]
    
    lr_metrics = {
        "model": "Logistic Regression (Baseline)",
        "roc_auc": float(roc_auc_score(y_test, lr_preds_prob)),
        "pr_auc": float(average_precision_score(y_test, lr_preds_prob)),
        "brier_score": float(brier_score_loss(y_test, lr_preds_prob)),
        "log_loss": float(log_loss(y_test, lr_preds_prob))
    }
    print(f"LR Baseline Metrics: ROC-AUC={lr_metrics['roc_auc']:.4f}, PR-AUC={lr_metrics['pr_auc']:.4f}")

    # 2. Tree Baseline: Random Forest
    rf_model = RandomForestClassifier(n_estimators=150, max_depth=6, random_state=42, class_weight="balanced")
    rf_model.fit(X_train, y_train)
    rf_preds_prob = rf_model.predict_proba(X_test)[:, 1]
    
    rf_metrics = {
        "model": "Random Forest",
        "roc_auc": float(roc_auc_score(y_test, rf_preds_prob)),
        "pr_auc": float(average_precision_score(y_test, rf_preds_prob)),
        "brier_score": float(brier_score_loss(y_test, rf_preds_prob)),
        "log_loss": float(log_loss(y_test, rf_preds_prob))
    }
    print(f"RF Tree Metrics: ROC-AUC={rf_metrics['roc_auc']:.4f}, PR-AUC={rf_metrics['pr_auc']:.4f}")

    # 3. Champion Model: XGBoost with Calibration
    scale_pos_weight = (len(y_train) - sum(y_train)) / max(1, sum(y_train))
    xgb_base = XGBClassifier(
        n_estimators=180,
        max_depth=4,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        eval_metric="logloss",
        random_state=42
    )
    xgb_base.fit(X_train, y_train)
    
    # Calibrate probabilities using 5-fold cross validation
    calibrated_xgb = CalibratedClassifierCV(estimator=xgb_base, method="sigmoid", cv=5)
    calibrated_xgb.fit(X_train, y_train)
    
    xgb_preds_prob = calibrated_xgb.predict_proba(X_test)[:, 1]
    xgb_preds_class = (xgb_preds_prob >= 0.20).astype(int)
    
    xgb_metrics = {
        "model": "XGBoost + Sigmoid Calibration (Production)",
        "roc_auc": float(roc_auc_score(y_test, xgb_preds_prob)),
        "pr_auc": float(average_precision_score(y_test, xgb_preds_prob)),
        "brier_score": float(brier_score_loss(y_test, xgb_preds_prob)),
        "log_loss": float(log_loss(y_test, xgb_preds_prob)),
        "confusion_matrix": confusion_matrix(y_test, xgb_preds_class).tolist(),
        "classification_report": classification_report(y_test, xgb_preds_class, output_dict=True)
    }
    print(f"XGBoost Production: ROC-AUC={xgb_metrics['roc_auc']:.4f}, PR-AUC={xgb_metrics['pr_auc']:.4f}, Brier={xgb_metrics['brier_score']:.4f}")
    
    # Feature importances from base XGBoost
    importances = xgb_base.feature_importances_
    feat_imp = [
        {"feature": name, "importance": float(imp)}
        for name, imp in sorted(zip(MODEL_FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    ]
    
    # Save artifacts
    artifacts = {
        "xgb_calibrated_model.joblib": calibrated_xgb,
        "xgb_base_model.joblib": xgb_base,
        "scaler.joblib": scaler,
        "lr_baseline_model.joblib": lr_model,
        "rf_model.joblib": rf_model
    }
    
    for filename, obj in artifacts.items():
        dst1 = os.path.join(models_dir, filename)
        joblib.dump(obj, dst1)
        dst2 = os.path.join(backend_artifacts_dir, filename)
        joblib.dump(obj, dst2)
        
    evaluation_summary = {
        "model_version": "xgb-v3.2-calibrated",
        "trained_at": "2026-09-12T01:00:00Z",
        "sample_size": len(df),
        "feature_count": len(MODEL_FEATURE_NAMES),
        "feature_names": MODEL_FEATURE_NAMES,
        "feature_importances": feat_imp,
        "models_comparison": [
            lr_metrics,
            rf_metrics,
            xgb_metrics
        ],
        "champion_metrics": {
            "roc_auc": xgb_metrics["roc_auc"],
            "pr_auc": xgb_metrics["pr_auc"],
            "brier_score": xgb_metrics["brier_score"],
            "log_loss": xgb_metrics["log_loss"]
        }
    }
    
    report_path = os.path.join(reports_dir, "model_evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(evaluation_summary, f, indent=2)
        
    backend_report_path = os.path.join(backend_artifacts_dir, "model_evaluation_report.json")
    with open(backend_report_path, "w") as f:
        json.dump(evaluation_summary, f, indent=2)
        
    print(f"Artifacts saved successfully in {models_dir} and {backend_artifacts_dir}")
    return evaluation_summary

if __name__ == "__main__":
    train_all_models()
