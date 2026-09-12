"""
Synthetic Data Generation for GigScore Alternative Credit Risk Assessment.
Generates realistic trip, earnings, driver platform histories, and historical loan repayment outcomes.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
import os

SEED = 42
np.random.seed(SEED)
random.seed(SEED)

DEMO_DRIVERS = [
    {
        "id": "drv_rajesh_001",
        "name": "Rajesh Kumar",
        "email": "rajesh.driver@gigscore.demo",
        "phone": "+91 98765 43210",
        "platform": "Uber & Ola",
        "vehicle_type": "Car (Sedan)",
        "city": "Bengaluru",
        "platform_start_date": "2023-01-15",
        "archetype": "stable_high",
        "base_income": 62000,
        "income_std": 4500,
        "active_days_mean": 27,
        "trips_per_day": 16.5,
        "completion_rate": 0.96,
        "cancellation_rate": 0.035,
        "rating": 4.89,
        "trend_slope": 0.03,
        "target_default": 0
    },
    {
        "id": "drv_amit_002",
        "name": "Amit Verma",
        "email": "amit.driver@gigscore.demo",
        "phone": "+91 98111 22334",
        "platform": "Swiggy & Zomato",
        "vehicle_type": "Two-Wheeler",
        "city": "Delhi NCR",
        "platform_start_date": "2024-06-10",
        "archetype": "moderate_volatile",
        "base_income": 38000,
        "income_std": 5000,
        "active_days_mean": 22,
        "trips_per_day": 13.5,
        "completion_rate": 0.89,
        "cancellation_rate": 0.08,
        "rating": 4.68,
        "trend_slope": 0.02,
        "target_default": 0
    },
    {
        "id": "drv_suresh_003",
        "name": "Suresh Yadav",
        "email": "suresh.driver@gigscore.demo",
        "phone": "+91 97222 33445",
        "platform": "Ola",
        "vehicle_type": "Auto Rickshaw",
        "city": "Mumbai",
        "platform_start_date": "2025-08-01",
        "archetype": "declining_high_risk",
        "base_income": 21000,
        "income_std": 11500,
        "active_days_mean": 13,
        "trips_per_day": 8.0,
        "completion_rate": 0.74,
        "cancellation_rate": 0.23,
        "rating": 4.32,
        "trend_slope": -0.22,
        "target_default": 1
    }
]

def generate_driver_records(driver_info, num_months=12):
    """Generates monthly earnings and aggregate ride history for a driver."""
    records = []
    end_date = datetime(2026, 8, 31)
    
    for m in range(num_months):
        # Go backwards from end_date
        month_offset = num_months - 1 - m
        # rough month date
        record_date = end_date - timedelta(days=month_offset * 30.5)
        month_str = record_date.strftime("%Y-%m")
        
        # Apply trend and noise
        trend_factor = 1.0 + (driver_info["trend_slope"] * (m - num_months / 2) / (num_months / 2))
        raw_income = driver_info["base_income"] * trend_factor + np.random.normal(0, driver_info["income_std"])
        net_income = max(8000, round(float(raw_income), 2))
        platform_fee = round(net_income * random.uniform(0.20, 0.25), 2)
        gross_income = round(net_income + platform_fee + random.uniform(1500, 3500), 2)
        other_costs = round(net_income * random.uniform(0.10, 0.18), 2) # fuel, maintenance
        
        active_days = min(30, max(5, int(np.random.normal(driver_info["active_days_mean"], 2))))
        trips = int(active_days * max(4, np.random.normal(driver_info["trips_per_day"], 2)))
        comp_rate = min(0.99, max(0.50, float(np.random.normal(driver_info["completion_rate"], 0.02))))
        canc_rate = min(0.40, max(0.01, float(np.random.normal(driver_info["cancellation_rate"], 0.015))))
        rating = min(5.0, max(3.5, float(np.random.normal(driver_info["rating"], 0.05))))
        
        records.append({
            "driver_id": driver_info["id"],
            "month": month_str,
            "gross_income": gross_income,
            "platform_fee": platform_fee,
            "other_costs": other_costs,
            "net_income": net_income,
            "active_days": active_days,
            "trips": trips,
            "completion_rate": round(comp_rate, 4),
            "cancellation_rate": round(canc_rate, 4),
            "avg_rating": round(rating, 2),
            "peak_hour_share": round(random.uniform(0.35, 0.65), 3),
            "weekend_share": round(random.uniform(0.25, 0.45), 3)
        })
        
    return records

def generate_synthetic_training_dataset(num_samples=1500):
    """
    Generates a full synthetic tabular dataset representing gig-worker loan histories.
    Includes target default (0 = repaid successfully, 1 = defaulted / severe delinquency).
    """
    data = []
    
    for i in range(num_samples):
        # 3 archetypes: 55% good/stable, 30% moderate, 15% high risk
        p = np.random.rand()
        if p < 0.55:
            # Stable / High performer
            tenure_months = int(np.random.uniform(18, 48))
            avg_income = np.random.uniform(48000, 80000)
            income_cv = np.random.uniform(0.08, 0.22)
            active_days = np.random.uniform(22, 29)
            trips_per_day = np.random.uniform(13, 22)
            completion_rate = np.random.uniform(0.92, 0.99)
            cancellation_rate = np.random.uniform(0.01, 0.06)
            avg_rating = np.random.uniform(4.75, 4.98)
            trend_slope = np.random.uniform(-0.05, 0.15)
            requested_emi = np.random.uniform(3000, 12000)
            default_prob_base = 0.04
        elif p < 0.85:
            # Moderate / Volatile
            tenure_months = int(np.random.uniform(8, 24))
            avg_income = np.random.uniform(28000, 48000)
            income_cv = np.random.uniform(0.22, 0.42)
            active_days = np.random.uniform(16, 23)
            trips_per_day = np.random.uniform(9, 15)
            completion_rate = np.random.uniform(0.82, 0.92)
            cancellation_rate = np.random.uniform(0.06, 0.15)
            avg_rating = np.random.uniform(4.50, 4.75)
            trend_slope = np.random.uniform(-0.15, 0.08)
            requested_emi = np.random.uniform(4000, 10000)
            default_prob_base = 0.18
        else:
            # High risk / Declining
            tenure_months = int(np.random.uniform(3, 14))
            avg_income = np.random.uniform(15000, 28000)
            income_cv = np.random.uniform(0.38, 0.70)
            active_days = np.random.uniform(9, 17)
            trips_per_day = np.random.uniform(5, 11)
            completion_rate = np.random.uniform(0.65, 0.82)
            cancellation_rate = np.random.uniform(0.14, 0.35)
            avg_rating = np.random.uniform(4.10, 4.52)
            trend_slope = np.random.uniform(-0.35, -0.05)
            requested_emi = np.random.uniform(4500, 9500)
            default_prob_base = 0.48

        # Calculate affordability & derived metrics
        estimated_disposable_income = avg_income * (1.0 - np.random.uniform(0.40, 0.60))
        requested_emi_to_income = requested_emi / max(avg_income, 1.0)
        
        # Risk score latent index - well calibrated across all 3 tiers
        risk_index = (
            - 1.4 * (avg_income / 50000.0)
            + 1.8 * (income_cv / 0.3)
            - 1.0 * (tenure_months / 24.0)
            - 1.2 * (active_days / 22.0)
            + 1.8 * (cancellation_rate / 0.1)
            - 1.2 * ((avg_rating - 4.0) / 0.8)
            - 1.5 * (trend_slope / 0.1)
            + 1.8 * (requested_emi_to_income / 0.2)
        )
        
        # Sigmoid calibration with moderate noise
        prob_default = 1.0 / (1.0 + np.exp(-(risk_index - 0.35 + np.random.normal(0, 0.20))))
        prob_default = float(np.clip(prob_default, 0.02, 0.95))
        target_default = int(np.random.rand() < prob_default)

        data.append({
            "driver_id": f"syn_{i+1:05d}",
            "avg_monthly_net_income": round(avg_income, 2),
            "income_std": round(avg_income * income_cv, 2),
            "coefficient_of_variation": round(income_cv, 4),
            "min_income": round(avg_income * max(0.4, 1.0 - income_cv * 1.5), 2),
            "months_with_income": min(12, tenure_months),
            "tenure_months": tenure_months,
            "active_days_monthly": round(active_days, 1),
            "trips_per_day": round(trips_per_day, 1),
            "trips_per_month": int(active_days * trips_per_day),
            "completion_rate": round(completion_rate, 4),
            "cancellation_rate": round(cancellation_rate, 4),
            "avg_rating": round(avg_rating, 2),
            "peak_hour_share": round(np.random.uniform(0.30, 0.70), 3),
            "weekend_share": round(np.random.uniform(0.20, 0.45), 3),
            "income_slope_3m": round(trend_slope, 4),
            "recent_vs_historical_income": round(1.0 + trend_slope, 3),
            "estimated_disposable_income": round(estimated_disposable_income, 2),
            "requested_emi_to_income": round(requested_emi_to_income, 4),
            "target_default": target_default
        })

    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    
    df_train = generate_synthetic_training_dataset(2000)
    train_path = os.path.join(out_dir, "synthetic_loan_data.csv")
    df_train.to_csv(train_path, index=False)
    print(f"Generated {len(df_train)} training records at {train_path}")
    print(f"Overall Default Rate: {df_train['target_default'].mean():.2%}")
    
    # Save demo profiles history
    demo_monthly = []
    for d in DEMO_DRIVERS:
        records = generate_driver_records(d, num_months=12)
        demo_monthly.extend(records)
    df_demo = pd.DataFrame(demo_monthly)
    demo_path = os.path.join(out_dir, "demo_driver_records.csv")
    df_demo.to_csv(demo_path, index=False)
    print(f"Generated demo drivers monthly records at {demo_path}")
