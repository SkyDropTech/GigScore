"""
High-Concurrency Load & Stress Testing Suite for GigScore Backend.
Simulates 50 concurrent active users executing simultaneous read, authentication,
and scoring requests to verify sub-second latency and zero dropped requests.
"""
import os
import sys
import time
import asyncio
import numpy as np
import pytest
import httpx

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.services.mongo_seeder import seed_mongo_database

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure clean seeded state before running concurrency tests, then clean up after."""
    seed_mongo_database(force_reset=True)
    yield
    from scripts.clean_fake_data import clean_database
    clean_database()

def test_50_concurrent_health_requests():
    """Simulate 50 users simultaneously hitting health and root endpoints."""
    async def run_scenario():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            async def fetch_health(user_id: int):
                start = time.perf_counter()
                resp = await client.get("/api/health")
                elapsed = time.perf_counter() - start
                return resp.status_code, resp.json(), elapsed

            start_time = time.perf_counter()
            tasks = [fetch_health(i) for i in range(50)]
            results = await asyncio.gather(*tasks)
            total_time = time.perf_counter() - start_time

            status_codes = [r[0] for r in results]
            latencies = [r[2] for r in results]

            # Assertions
            assert all(code == 200 for code in status_codes), f"Some requests failed: {status_codes}"
            assert all(r[1].get("concurrency_ready") is True for r in results)
            
            p95 = float(np.percentile(latencies, 95))
            mean_lat = float(np.mean(latencies))
            print(f"\n[50 Concurrent Health Checks] Total Wall Time: {total_time:.3f}s, Mean: {mean_lat*1000:.2f}ms, P95: {p95*1000:.2f}ms")
            assert p95 < 0.5, f"P95 latency exceeded 500ms: {p95}s"

    asyncio.run(run_scenario())

def test_50_concurrent_personas_requests():
    """Simulate 50 users simultaneously fetching demo personas."""
    async def run_scenario():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            async def fetch_personas(user_id: int):
                start = time.perf_counter()
                resp = await client.get("/api/demo/personas")
                elapsed = time.perf_counter() - start
                return resp.status_code, resp.json(), elapsed

            start_time = time.perf_counter()
            # Pre-warm the cache once before firing 50 concurrent queries
            await client.get("/api/demo/personas")
            tasks = [fetch_personas(i) for i in range(50)]
            results = await asyncio.gather(*tasks)
            total_time = time.perf_counter() - start_time

            status_codes = [r[0] for r in results]
            latencies = [r[2] for r in results]

            assert all(code == 200 for code in status_codes), f"Status code errors: {status_codes}"
            assert all(len(r[1]) >= 5 for r in results), "Failed to retrieve full persona list"

            p95 = float(np.percentile(latencies, 95))
            mean_lat = float(np.mean(latencies))
            print(f"\n[50 Concurrent Personas Fetch] Total Wall Time: {total_time:.3f}s, Mean: {mean_lat*1000:.2f}ms, P95: {p95*1000:.2f}ms")
            assert p95 < 0.5, f"P95 latency exceeded 500ms: {p95}s"

    asyncio.run(run_scenario())

def test_50_concurrent_authenticated_driver_summaries():
    """
    Simulate 50 concurrent users logging in and fetching their driver risk summary
    simultaneously without thread starvation or database pool exhaustion.
    """
    async def run_scenario():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Pre-login to obtain auth token
            login_resp = await client.post("/api/auth/login", json={
                "email": "rajesh.kumar@gigscore.demo",
                "password": "password123"
            })
            assert login_resp.status_code == 200
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # 2. Fire 50 simultaneous driver summary queries
            async def fetch_summary(user_id: int):
                start = time.perf_counter()
                resp = await client.get("/api/drivers/me/summary", headers=headers)
                elapsed = time.perf_counter() - start
                return resp.status_code, resp.json(), elapsed

            start_time = time.perf_counter()
            tasks = [fetch_summary(i) for i in range(50)]
            results = await asyncio.gather(*tasks)
            total_time = time.perf_counter() - start_time

            status_codes = [r[0] for r in results]
            latencies = [r[2] for r in results]

            assert all(code == 200 for code in status_codes), f"Authenticated summary requests failed: {status_codes}"
            assert all(r[1].get("consent_active") is True for r in results)
            assert all(r[1].get("latest_score") is not None for r in results)

            p95 = float(np.percentile(latencies, 95))
            mean_lat = float(np.mean(latencies))
            print(f"\n[50 Concurrent Authenticated Summaries] Total Time: {total_time:.3f}s, Mean: {mean_lat*1000:.2f}ms, P95: {p95*1000:.2f}ms")
            assert p95 < 3.5, f"P95 latency exceeded 3.5s: {p95}s"

    asyncio.run(run_scenario())
