import sys
import requests

import time
import uuid

BASE = 'http://127.0.0.1:8000/api'
email = f'test_lock_flow_{int(time.time())}_{uuid.uuid4().hex[:4]}@gigscore.in'
pwd = 'Password123!'

print("1. Registering new driver account...", flush=True)
r = requests.post(f'{BASE}/auth/register', json={
    'email': email,
    'password': pwd,
    'full_name': 'Test Gated Driver',
    'phone': '+919876543210',
    'role': 'DRIVER'
}, timeout=10)
print('Register status:', r.status_code, flush=True)
tok = r.json().get('access_token')
headers = {'Authorization': f'Bearer {tok}'}

print("2. Checking monthly earnings before ingest (MUST BE ZERO)...", flush=True)
earn = requests.get(f'{BASE}/drivers/me/monthly-earnings', headers=headers, timeout=10).json()
print('Monthly earnings count before upload/predict:', len(earn), flush=True)
assert len(earn) == 0, f"Expected 0 earnings for new user, got {len(earn)}"

print("3. Attaching verified PDF statement...", flush=True)
sample_resp = requests.post(f'{BASE}/drivers/me/sample-statement', headers=headers, timeout=10)
print('Sample statement attach:', sample_resp.status_code, sample_resp.json().get('message'), flush=True)
print('Parsed driver info:', sample_resp.json().get('parsed_driver_info'), flush=True)
print('Parsed months count:', sample_resp.json().get('parsed_months_count'), flush=True)

print("4. Executing ingest and XGBoost prediction...", flush=True)
ingest_resp = requests.post(f'{BASE}/drivers/me/ingest', headers=headers, timeout=15)
print('Ingest status:', ingest_resp.status_code, flush=True)
assessment = ingest_resp.json().get('assessment', {})
print('ML Score:', assessment.get('score'), 'Risk Band:', assessment.get('risk_band'), flush=True)

print("5. Checking monthly earnings after predict...", flush=True)
earn_after = requests.get(f'{BASE}/drivers/me/monthly-earnings', headers=headers, timeout=10).json()
print('Monthly earnings count after predict:', len(earn_after), flush=True)
assert len(earn_after) >= 6, f"Expected at least 6 parsed months, got {len(earn_after)}"
print('Sample Month 1:', earn_after[0].get('month'), 'Gross: Rs.', earn_after[0].get('gross_income'), 'Net: Rs.', earn_after[0].get('net_income'), flush=True)
print('Sample Last Month:', earn_after[-1].get('month'), 'Gross: Rs.', earn_after[-1].get('gross_income'), 'Net: Rs.', earn_after[-1].get('net_income'), flush=True)

print("6. Checking driver summary after predict...", flush=True)
summary = requests.get(f'{BASE}/drivers/me/summary', headers=headers, timeout=10).json()
print('Driver summary - Avg Net: Rs.', summary.get('avg_monthly_net_income'), 'Trips: ', summary.get('avg_trips_per_month'), 'Rating:', summary.get('avg_rating'), flush=True)

print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!", flush=True)
