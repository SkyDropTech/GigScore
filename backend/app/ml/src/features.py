"""
Feature engineering pipeline for GigScore Alternative Credit Risk Assessment.
Calculates income consistency, stability, work performance, utilization, and affordability metrics.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any

# Canonical list of model features in exact training order
MODEL_FEATURE_NAMES = [
    "avg_monthly_net_income",
    "income_std",
    "coefficient_of_variation",
    "min_income",
    "months_with_income",
    "tenure_months",
    "active_days_monthly",
    "trips_per_day",
    "trips_per_month",
    "completion_rate",
    "cancellation_rate",
    "avg_rating",
    "peak_hour_share",
    "weekend_share",
    "income_slope_3m",
    "recent_vs_historical_income",
    "estimated_disposable_income",
    "requested_emi_to_income"
]

FEATURE_DESCRIPTIONS = {
    "avg_monthly_net_income": "Average Monthly Net Earnings (Post-Platform Fee & Fuel)",
    "income_std": "Income Standard Deviation (Volatility measure)",
    "coefficient_of_variation": "Income Coefficient of Variation (Risk of erratic earnings)",
    "min_income": "Minimum Recorded Monthly Net Income",
    "months_with_income": "Months with Verified Gig Inflow",
    "tenure_months": "Total Tenure on Gig Platforms (Months)",
    "active_days_monthly": "Average Active Driving/Delivery Days per Month",
    "trips_per_day": "Average Completed Trips per Active Day",
    "trips_per_month": "Average Completed Trips per Month",
    "completion_rate": "Trip Acceptance & Completion Ratio (0-1)",
    "cancellation_rate": "Driver Initiated Cancellation Ratio (0-1)",
    "avg_rating": "Average Customer Rating (1-5)",
    "peak_hour_share": "Proportion of Trips in High-Surge Peak Hours",
    "weekend_share": "Proportion of Trips on Weekends",
    "income_slope_3m": "3-Month Earnings Growth Trajectory (+/- Slope)",
    "recent_vs_historical_income": "Recent 3-Month vs 12-Month Earnings Ratio",
    "estimated_disposable_income": "Estimated Net Disposable Income after Living Costs",
    "requested_emi_to_income": "Requested Loan EMI to Monthly Net Income Ratio"
}

def calculate_driver_features_from_monthly(
    driver_profile: Dict[str, Any],
    monthly_records: List[Dict[str, Any]],
    requested_loan_amount: float = 50000.0,
    requested_tenure_months: int = 12
) -> Dict[str, Any]:
    """
    Computes aggregated features from raw driver monthly records and requested loan parameters.
    """
    if not monthly_records:
        raise ValueError("Cannot calculate features without monthly records.")
        
    df_m = pd.DataFrame(monthly_records)
    
    # Sort chronologically if month column exists
    if "month" in df_m.columns:
        df_m = df_m.sort_values(by="month")
        
    net_incomes = df_m["net_income"].values
    avg_net_income = float(np.mean(net_incomes))
    income_std = float(np.std(net_incomes)) if len(net_incomes) > 1 else 0.0
    cv = float(income_std / avg_net_income) if avg_net_income > 0 else 1.0
    min_income = float(np.min(net_incomes))
    months_with_income = int(len(df_m))
    
    tenure_months = int(driver_profile.get("tenure_months", 12))
    active_days_monthly = float(np.mean(df_m["active_days"]))
    
    trips_series = df_m["trips"].values
    trips_per_month = int(np.mean(trips_series))
    trips_per_day = float(trips_per_month / max(1.0, active_days_monthly))
    
    completion_rate = float(np.mean(df_m["completion_rate"]))
    cancellation_rate = float(np.mean(df_m["cancellation_rate"]))
    avg_rating = float(np.mean(df_m["avg_rating"]))
    
    peak_hour_share = float(np.mean(df_m["peak_hour_share"])) if "peak_hour_share" in df_m.columns else 0.45
    weekend_share = float(np.mean(df_m["weekend_share"])) if "weekend_share" in df_m.columns else 0.30
    
    # 3-month slope
    if len(net_incomes) >= 3:
        recent_3m = net_incomes[-3:]
        # normalize by avg
        normalized_recent = recent_3m / max(1.0, avg_net_income)
        x = np.array([0, 1, 2])
        slope, _ = np.polyfit(x, normalized_recent, 1)
        income_slope_3m = float(slope)
        recent_avg = np.mean(recent_3m)
        recent_vs_historical = float(recent_avg / max(1.0, avg_net_income))
    else:
        income_slope_3m = 0.0
        recent_vs_historical = 1.0
        
    # Standard 18% annual interest assumption for loan EMI calculation
    annual_rate = 0.18
    monthly_rate = annual_rate / 12.0
    n = max(1, requested_tenure_months)
    emi = requested_loan_amount * monthly_rate * ((1 + monthly_rate)**n) / (((1 + monthly_rate)**n) - 1)
    
    estimated_disposable_income = avg_net_income * 0.50 # estimated 50% basic subsistence / living expenses
    requested_emi_to_income = float(emi / max(1.0, avg_net_income))
    
    feature_dict = {
        "avg_monthly_net_income": round(avg_net_income, 2),
        "income_std": round(income_std, 2),
        "coefficient_of_variation": round(cv, 4),
        "min_income": round(min_income, 2),
        "months_with_income": months_with_income,
        "tenure_months": tenure_months,
        "active_days_monthly": round(active_days_monthly, 1),
        "trips_per_day": round(trips_per_day, 1),
        "trips_per_month": trips_per_month,
        "completion_rate": round(completion_rate, 4),
        "cancellation_rate": round(cancellation_rate, 4),
        "avg_rating": round(avg_rating, 2),
        "peak_hour_share": round(peak_hour_share, 3),
        "weekend_share": round(weekend_share, 3),
        "income_slope_3m": round(income_slope_3m, 4),
        "recent_vs_historical_income": round(recent_vs_historical, 3),
        "estimated_disposable_income": round(estimated_disposable_income, 2),
        "requested_emi_to_income": round(requested_emi_to_income, 4),
        "estimated_emi": round(emi, 2)
    }
    
    return feature_dict

def prepare_feature_vector(feature_dict: Dict[str, Any]) -> np.ndarray:
    """Returns a 2D numpy array with features ordered exactly as expected by the model."""
    vector = [feature_dict[col] for col in MODEL_FEATURE_NAMES]
    return np.array([vector], dtype=np.float32)
