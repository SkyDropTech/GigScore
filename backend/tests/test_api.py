"""
Comprehensive API and Integration Tests for GigScore Backend using standard unittest.
"""
import unittest
from fastapi.testclient import TestClient
import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.services.mongo_seeder import seed_mongo_database

class TestGigScoreAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_mongo_database(force_reset=True)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        from scripts.clean_fake_data import clean_database
        clean_database()

    def test_01_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_02_demo_personas(self):
        response = self.client.get("/api/demo/personas")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 5)
        emails = [p["email"] for p in data]
        self.assertIn("rajesh.kumar@gigscore.demo", emails)
        self.assertIn("priya.underwriter@gigscore.demo", emails)
        self.assertIn("admin@gigscore.demo", emails)

    def test_03_driver_rajesh_low_risk_assessment(self):
        login_resp = self.client.post("/api/auth/login", json={
            "email": "rajesh.kumar@gigscore.demo",
            "password": "password123"
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        summary_resp = self.client.get("/api/drivers/me/summary", headers=headers)
        self.assertEqual(summary_resp.status_code, 200)
        summary = summary_resp.json()
        self.assertTrue(summary["consent_active"])
        self.assertIsNotNone(summary["latest_score"])
        self.assertGreaterEqual(summary["latest_score"], 750)
        self.assertEqual(summary["latest_risk_band"], "LOW")

    def test_04_driver_amit_moderate_risk_assessment(self):
        login_resp = self.client.post("/api/auth/login", json={
            "email": "amit.shinde@gigscore.demo",
            "password": "password123"
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        summary_resp = self.client.get("/api/drivers/me/summary", headers=headers)
        self.assertEqual(summary_resp.status_code, 200)
        summary = summary_resp.json()
        self.assertIn(summary["latest_risk_band"], ["LOW", "MEDIUM"])

    def test_05_driver_imran_high_risk_assessment(self):
        login_resp = self.client.post("/api/auth/login", json={
            "email": "imran.khan@gigscore.demo",
            "password": "password123"
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        summary_resp = self.client.get("/api/drivers/me/summary", headers=headers)
        self.assertEqual(summary_resp.status_code, 200)
        summary = summary_resp.json()
        self.assertEqual(summary["latest_risk_band"], "HIGH")
        self.assertLess(summary["latest_score"], 650)

    def test_06_lender_queue_and_review(self):
        login_resp = self.client.post("/api/auth/login", json={
            "email": "priya.underwriter@gigscore.demo",
            "password": "password123"
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        queue_resp = self.client.get("/api/lender/applications", headers=headers)
        self.assertEqual(queue_resp.status_code, 200)
        applications = queue_resp.json()
        self.assertGreater(len(applications), 0)

        first_app = applications[0]
        self.assertIsNotNone(first_app["latest_assessment"])
        self.assertGreater(len(first_app["latest_assessment"]["factors"]), 0)

        review_resp = self.client.post(
            f"/api/lender/applications/{first_app['id']}/review",
            json={"action": "APPROVE", "notes": "Approved based on solid income track record and low CV."},
            headers=headers
        )
        self.assertEqual(review_resp.status_code, 200)
        self.assertEqual(review_resp.json()["status"], "APPROVED")

    def test_07_portfolio_analytics(self):
        login_resp = self.client.post("/api/auth/login", json={
            "email": "priya.underwriter@gigscore.demo",
            "password": "password123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        portfolio_resp = self.client.get("/api/lender/portfolio", headers=headers)
        self.assertEqual(portfolio_resp.status_code, 200)
        data = portfolio_resp.json()
        self.assertIn("total_applications", data)
        self.assertIn("average_score", data)
        self.assertIn("risk_band_breakdown", data)

    def test_08_audit_log_viewer(self):
        login_resp = self.client.post("/api/auth/login", json={
            "email": "admin@gigscore.demo",
            "password": "password123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        audit_resp = self.client.get("/api/audit", headers=headers)
        self.assertEqual(audit_resp.status_code, 200)
        logs = audit_resp.json()
        self.assertGreater(len(logs), 0)

if __name__ == "__main__":
    unittest.main()
