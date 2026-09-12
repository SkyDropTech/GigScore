import time
import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.getcode(), json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def test_fresh_driver_workflow():
    print("=== Testing Fresh Driver Onboarding & Strict Lock Rules ===")

    # 1. Register a brand new driver with fresh email
    ts = int(time.time())
    email = f"vikram.{ts}@example.com"
    driver_data = {
        "email": email,
        "password": "Driver@12345",
        "full_name": f"Vikram Singh {ts % 1000}",
        "role": "driver",
        "phone": f"+91 98111 {ts % 100000:05d}",
        "city": "Bengaluru",
        "platform": "Ola & Uber",
        "vehicle_type": "Sedan (Dzire)"
    }
    code, res = make_req("/auth/register", "POST", driver_data)
    assert code == 200, f"Register failed: {res}"
    token = res["access_token"]
    print(f"[PASS] 1. New Driver Registered: {res['full_name']} ({res['email']})")

    # 2. Verify initial state has NO data
    code, earnings = make_req("/drivers/me/earnings", "GET", token=token)
    assert code == 200 and len(earnings) == 0, f"Expected 0 earnings before upload, got: {earnings}"
    print(f"[PASS] 2. Verified clean initial state: 0 earnings records in MongoDB")

    code, summary = make_req("/drivers/me/summary", "GET", token=token)
    assert code == 200 and summary["data_freshness"] == "No data available", f"Unexpected summary: {summary}"
    print(f"[PASS] 3. Verified summary status: '{summary['data_freshness']}'")

    # 3. Attempt to apply for loan BEFORE uploading file and connecting APIs -> MUST FAIL (400)
    code, err = make_req("/loans", "POST", {
        "requested_amount": 70000.0,
        "tenure_months": 12,
        "purpose": "Vehicle Maintenance"
    }, token=token)
    assert code == 400, f"Expected 400 when applying without file & APIs, got {code}: {err}"
    print(f"[PASS] 4. Strict Lock Verified: Loan application blocked with 400 -> '{err.get('detail')}'")

    # 4. Ingest Data: Upload Statement PDF and Connect both Ola & Uber APIs
    code, ingest_res = make_req("/drivers/me/ingest", "POST", {
        "file_name": "vikram_driver_axis_bank_statement.pdf",
        "file_size": "3.8 MB",
        "ola_connected": True,
        "uber_connected": True
    }, token=token)
    assert code == 200, f"Ingest failed: {ingest_res}"
    asmt = ingest_res["assessment"]
    print(f"[PASS] 5. Data Ingestion Executed: Statement PDF uploaded + Ola & Uber APIs linked")
    print(f"       -> Live ML Prediction: Score={asmt['score']}/900, Risk Band={asmt['risk_band']}")
    print(f"       -> Recommended Capital Limit: Rs.{asmt['recommended_amount']}")

    # 5. Verify data is now unlocked
    code, earnings_unlocked = make_req("/drivers/me/earnings", "GET", token=token)
    assert code == 200 and len(earnings_unlocked) == 12, f"Expected 12 records, got: {len(earnings_unlocked)}"
    print(f"[PASS] 6. Earning Statement Unlocked: 12 months of verified platform ledger records loaded")

    # 6. Apply for Loan Demand (NOW UNLOCKED)
    code, loan = make_req("/loans", "POST", {
        "requested_amount": 70000.0,
        "tenure_months": 12,
        "purpose": "Vehicle Maintenance & Tyre Replacement"
    }, token=token)
    assert code == 200, f"Loan demand failed after ingest: {loan}"
    assert loan["uploaded_file_name"] == "vikram_driver_axis_bank_statement.pdf", f"Unexpected file: {loan.get('uploaded_file_name')}"
    print(f"[PASS] 7. Loan Demand Submitted: ID={loan['id']}, Amount=Rs.{loan['requested_amount']}, Statement={loan['uploaded_file_name']}")

    # 7. Check My Active Loans tab response
    code, active_loans = make_req("/loans", "GET", token=token)
    assert code == 200 and len(active_loans) >= 1, f"Expected active loan, got {active_loans}"
    print(f"[PASS] 8. My Active Loans Verified: Found {len(active_loans)} active loan(s) for driver")

    # 8. Admin Portal Sync Check
    code, admin_login = make_req("/auth/login", "POST", {
        "email": "admin@gigscore.com",
        "password": "Admin@123456"
    })
    admin_token = admin_login["access_token"]
    code, admin_queue = make_req("/lender/applications", "GET", token=admin_token)
    found_in_admin = [a for a in admin_queue if a["id"] == loan["id"]]
    assert len(found_in_admin) > 0, "Application did not sync to Admin portal!"
    admin_app = found_in_admin[0]
    assert admin_app["uploaded_file_name"] == "vikram_driver_axis_bank_statement.pdf"
    print(f"[PASS] 9. Admin Sync Verified: Application {loan['id']} found in Admin queue with statement '{admin_app['uploaded_file_name']}'")

    print("\nALL WORKFLOW TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_fresh_driver_workflow()
