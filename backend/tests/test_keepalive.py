"""
Tests for Keep-Alive and Anti-Sleep endpoints and services.
"""
import unittest
import os
import sys
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.services.keepalive import keepalive_service

class TestKeepAlive(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_ping_get(self):
        """Verify GET /api/ping responds 200 with ok status."""
        response = self.client.get("/api/ping")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["message"], "pong")
        self.assertIn("timestamp", data)
        self.assertIn("bot_target", data)

    def test_ping_head(self):
        """Verify HEAD /api/ping responds 200 (frequently used by UptimeRobot)."""
        response = self.client.head("/api/ping")
        self.assertEqual(response.status_code, 200)

    def test_keepalive_status(self):
        """Verify /api/keepalive/status returns metrics and updates when pinged."""
        # Ping the endpoint
        self.client.get("/api/ping")
        response = self.client.get("/api/keepalive/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("self_ping", data)
        self.assertIn("external_monitoring", data)
        self.assertIn("instructions", data)
        self.assertGreaterEqual(data["external_monitoring"]["total_pings_received"], 1)

    def test_uptimerobot_missing_key_validation(self):
        """Verify endpoint gracefully handles missing API key."""
        response = self.client.post("/api/keepalive/setup-uptimerobot", json={})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("No UptimeRobot API key provided", data["error"])

if __name__ == "__main__":
    unittest.main()
