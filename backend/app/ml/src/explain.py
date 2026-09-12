"""
Explainability engine for GigScore.
Extracts SHAP factor contributions from XGBoost tree models and maps them into
plain-English positive and negative underwriting reason codes.
"""
import os
import joblib
import numpy as np
import shap
from typing import Dict, List, Any

from features import MODEL_FEATURE_NAMES, FEATURE_DESCRIPTIONS

class CreditExplainer:
    def __init__(self, model_path: str = None):
        if model_path is None:
            # Default search path
            base_dir = os.path.dirname(__file__)
            candidate_paths = [
                os.path.join(base_dir, "..", "models", "xgb_base_model.joblib"),
                os.path.join(base_dir, "..", "..", "backend", "app", "ml", "artifacts", "xgb_base_model.joblib"),
            ]
            for p in candidate_paths:
                if os.path.exists(p):
                    model_path = p
                    break
                    
        if not model_path or not os.path.exists(model_path):
            raise FileNotFoundError(f"XGBoost model file not found at {model_path}")
            
        self.xgb_model = joblib.load(model_path)
        self.explainer = shap.TreeExplainer(self.xgb_model)
        self.feature_names = MODEL_FEATURE_NAMES

    def explain_instance(self, feature_dict: Dict[str, Any], top_k: int = 5) -> Dict[str, Any]:
        """
        Computes SHAP values for a single driver's feature vector and formats
        top positive and negative contributing factors with human-readable explanations.
        """
        vector = np.array([[feature_dict[col] for col in self.feature_names]], dtype=np.float32)
        raw_shap_values = self.explainer.shap_values(vector)
        
        # In binary classification, check shape: either (1, num_features) or list
        if isinstance(raw_shap_values, list):
            sv = raw_shap_values[1][0] if len(raw_shap_values) > 1 else raw_shap_values[0][0]
        elif len(raw_shap_values.shape) == 2:
            sv = raw_shap_values[0]
        else:
            sv = raw_shap_values[0]

        factors = []
        for name, shap_val in zip(self.feature_names, sv):
            val = feature_dict.get(name, 0.0)
            # In risk models, lower risk (negative SHAP log-odds of default) is POSITIVE for credit score.
            # So negative SHAP value = increases credit score (positive impact for driver).
            # Positive SHAP value = increases default risk (negative impact for driver).
            # Let's align direction from the borrower / credit score perspective:
            # "positive" means helps the credit score / lowers default risk
            # "negative" means hurts the credit score / increases default risk
            direction = "positive" if shap_val < 0 else "negative"
            # contribution absolute magnitude
            mag = float(abs(shap_val))
            
            reason = self._generate_reason_text(name, val, direction)
            factors.append({
                "feature_name": name,
                "feature_title": FEATURE_DESCRIPTIONS.get(name, name),
                "feature_value": val,
                "shap_value": float(shap_val),
                "magnitude": mag,
                "direction": direction,
                "display_reason": reason
            })
            
        # Sort factors by impact magnitude
        factors.sort(key=lambda x: x["magnitude"], reverse=True)
        
        top_positive = [f for f in factors if f["direction"] == "positive"][:top_k]
        top_negative = [f for f in factors if f["direction"] == "negative"][:top_k]
        
        return {
            "all_factors": factors,
            "top_positive": top_positive,
            "top_negative": top_negative,
            "key_factors": factors[:top_k * 2]
        }

    def _generate_reason_text(self, name: str, value: Any, direction: str) -> str:
        """Translates numeric features into plain-English underwriting rationale."""
        if name == "avg_monthly_net_income":
            if direction == "positive":
                return f"Strong monthly net earnings averaging ₹{value:,.0f}"
            return f"Modest monthly net earnings averaging ₹{value:,.0f}"
            
        if name == "tenure_months":
            if direction == "positive":
                return f"Substantial gig platform tenure ({value} months of verified track record)"
            return f"Limited platform tenure history ({value} months on platform)"
            
        if name == "cancellation_rate":
            if direction == "positive":
                return f"Exemplary low ride cancellation rate ({value*100:.1f}%)"
            return f"Elevated cancellation rate ({value*100:.1f}%), signaling work disruptions"
            
        if name == "completion_rate":
            if direction == "positive":
                return f"High ride completion consistency ({value*100:.1f}%)"
            return f"Below-average trip completion rate ({value*100:.1f}%)"
            
        if name == "coefficient_of_variation":
            if direction == "positive":
                return f"Remarkable earnings stability month-over-month (low volatility: {value:.2f})"
            return f"Volatile income fluctuation from month to month (variance: {value:.2f})"
            
        if name == "active_days_monthly":
            if direction == "positive":
                return f"High commitment with {value:.0f} active working days per month"
            return f"Intermittent work schedule averaging only {value:.0f} active days/month"
            
        if name == "avg_rating":
            if direction == "positive":
                return f"Exceptional customer feedback rating ({value:.2f} out of 5.0)"
            return f"Subpar passenger rating ({value:.2f} out of 5.0)"
            
        if name == "income_slope_3m":
            if direction == "positive":
                return f"Healthy upward income momentum (+{value*100:.1f}% recent growth)"
            return f"Declining recent earnings trend ({value*100:.1f}% over last quarter)"
            
        if name == "requested_emi_to_income":
            if direction == "positive":
                return f"Well-cushioned EMI burden ({value*100:.1f}% of monthly income)"
            return f"High debt service burden (EMI demands {value*100:.1f}% of net income)"
            
        if name == "trips_per_day":
            if direction == "positive":
                return f"Robust daily productivity averaging {value:.1f} trips per active day"
            return f"Low daily trip volume ({value:.1f} trips/day)"
            
        if name == "estimated_disposable_income":
            if direction == "positive":
                return f"Estimated monthly disposable surplus of ₹{value:,.0f}"
            return f"Tight disposable income headroom of ₹{value:,.0f}"
            
        return f"{name.replace('_', ' ').title()}: {value}"
