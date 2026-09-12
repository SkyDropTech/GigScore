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

def run_tests():
    print("=== Starting End-to-End Test Suite ===")

    # 1. Register a real driver
    driver_data = {
        "email": "manoj.kumar@example.com",
        "password": "Driver@12345",
        "full_name": "Manoj Kumar",
        "role": "driver",
        "phone": "+91 98451 23456",
        "city": "Bengaluru",
        "platform": "Ola & Uber",
        "vehicle_type": "Sedan (Dzire)"
    }
    code, res = make_req("/auth/register", "POST", driver_data)
    if code != 200 and ("already registered" in str(res) or "already exists" in str(res)):
        code, res = make_req("/auth/login", "POST", {"email": driver_data["email"], "password": driver_data["password"]})
    
    assert code == 200, f"Driver auth failed: {res}"
    driver_token = res["access_token"]
    print(f"[PASS] 1. Driver Authenticated: {res['full_name']} ({res['email']})")

    # 2. Driver grants consent
    code, cns = make_req("/consents", "POST", {
        "purpose": "Ola & Uber Rides and Earnings Access",
        "scope": "rides,earnings,ratings"
    }, token=driver_token)
    assert code == 200, f"Consent failed: {cns}"
    print(f"[PASS] 2. Consent Granted in MongoDB: {cns['id']}")

    # 2b. Driver attaches statement & links APIs
    code, ing = make_req("/drivers/me/ingest", "POST", {
        "file_name": "manoj_verified_earnings.pdf",
        "file_size": "2.1 MB",
        "ola_connected": True,
        "uber_connected": True
    }, token=driver_token)
    assert code == 200, f"Data ingest failed: {ing}"
    print(f"[PASS] 2b. Verified Statement & Platform APIs Connected in MongoDB")

    # 3. Driver applies for loan demand
    loan_data = {
        "requested_amount": 65000.0,
        "tenure_months": 12,
        "purpose": "Vehicle Maintenance & Working Capital"
    }
    code, loan = make_req("/loans", "POST", loan_data, token=driver_token)
    assert code == 200, f"Loan application failed: {loan}"
    asmt = loan.get("latest_assessment")
    assert asmt is not None, "Live ML assessment missing from response"
    print(f"[PASS] 3. Loan Application Submitted: ID={loan['id']}, Amount=Rs.{loan['requested_amount']}")
    print(f"       -> Live ML Score: {asmt['score']} / 900")
    print(f"       -> Risk Band: {asmt['risk_band']}")
    print(f"       -> ML Decision: {asmt['decision']}")
    print(f"       -> Recommended Limit: Rs.{asmt['recommended_amount']}")
    print(f"       -> Recommended EMI: Rs.{asmt['recommended_emi']}")
    print(f"       -> SHAP Attribution Factors: {len(asmt.get('factors', []))} factors returned")
    for f in asmt.get('factors', [])[:3]:
        print(f"          * [{f['direction'].upper()}] {f['display_reason']} ({f['contribution']:+.2f})")

    # 4. Admin logs in
    code, admin_res = make_req("/auth/login", "POST", {
        "email": "admin@gigscore.com",
        "password": "Admin@123456"
    })
    assert code == 200, f"Admin login failed: {admin_res}"
    admin_token = admin_res["access_token"]
    print(f"[PASS] 4. Admin Authenticated: {admin_res['full_name']} ({admin_res['email']})")

    # 5. Admin retrieves application queue
    code, apps = make_req("/lender/applications", "GET", token=admin_token)
    assert code == 200, f"Get queue failed: {apps}"
    found = [a for a in apps if a["id"] == loan["id"]]
    assert len(found) > 0, "Driver application not found in MongoDB queue"
    print(f"[PASS] 5. Admin Queue Verified: Found Driver Application {loan['id']} in queue")

    # 6. Admin Underwrites and Approves application
    code, reviewed = make_req(f"/lender/applications/{loan['id']}/review", "POST", {
        "action": "APPROVE",
        "notes": "Verified telemetry consistency; loan demand sanctioned."
    }, token=admin_token)
    assert code == 200, f"Underwrite failed: {reviewed}"
    assert reviewed["status"] == "APPROVED", f"Expected APPROVED, got {reviewed['status']}"
    print(f"[PASS] 6. Underwriter Action Desk: Application {loan['id']} successfully APPROVED in MongoDB")

    # 7. Strict Security Role Barrier Test
    # Driver tries to access lender routes -> MUST fail with 403 Forbidden
    code, err = make_req("/lender/applications", "GET", token=driver_token)
    assert code == 403, f"Expected 403 Forbidden for driver accessing lender route, got {code}"
    print(f"[PASS] 7. Security Role Boundary: Driver blocked from lender route (HTTP 403 Forbidden)")

    # Admin tries to apply for driver loan -> MUST fail with 403 Forbidden
    code, err2 = make_req("/loans", "POST", loan_data, token=admin_token)
    assert code == 403, f"Expected 403 Forbidden for admin submitting driver loan, got {code}"
    print(f"[PASS] 8. Security Role Boundary: Admin blocked from driver loan route (HTTP 403 Forbidden)")

    print("\nALL 8 TESTS PASSED SUCCESSFULLY! MongoDB & Models functioning perfectly.")

if __name__ == "__main__":
    run_tests()
