#!/usr/bin/env python3
"""
UptimeRobot Setup & Verification CLI Script.
Automates monitor creation on https://dashboard.uptimerobot.com/ for GigScore.
"""
import sys
import os
import argparse
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.services.keepalive import keepalive_service

async def main():
    parser = argparse.ArgumentParser(description="GigScore UptimeRobot Keep-Alive Bot Setup")
    parser.add_argument("--api-key", "-k", help="Your UptimeRobot Main API Key (from https://dashboard.uptimerobot.com/my/api)")
    parser.add_argument("--url", "-u", help="Backend public URL to ping (defaults to configured URL)")
    parser.add_argument("--name", "-n", default="GigScore Backend Keep-Alive Bot", help="Monitor friendly name")
    parser.add_argument("--interval", "-i", type=int, default=300, help="Interval in seconds (default: 300 / 5 min)")
    parser.add_argument("--status", "-s", action="store_true", help="Fetch existing monitors status")
    parser.add_argument("--dry-run", action="store_true", help="Simulate monitor creation without sending request")

    args = parser.parse_args()

    api_key = args.api_key or settings.UPTIMEROBOT_API_KEY
    target_url = args.url or keepalive_service.get_ping_url()

    print("=" * 65)
    print(" GigScore UptimeRobot Anti-Sleep Bot Setup")
    print("=" * 65)
    print(f"Target Keep-Alive URL : {target_url}")
    print(f"Ping Interval         : {args.interval}s (5 minutes)")
    print(f"Monitor Friendly Name : {args.name}")
    print("=" * 65)

    if args.dry_run:
        print("[DRY-RUN] Would create HTTP(s) monitor with:")
        print(f"  URL: {target_url}")
        print(f"  API Key: {'*' * (len(api_key)-4) + api_key[-4:] if api_key else 'None'}")
        print(f"  Interval: {args.interval} seconds")
        print("\nDry run completed successfully.")
        return

    if not api_key:
        print("\n[ERROR] No UptimeRobot API key found!")
        print("You can provide it via:")
        print("  1. --api-key <YOUR_KEY> argument")
        print("  2. Setting UPTIMEROBOT_API_KEY in your backend/.env file")
        print("\nTo obtain your API key:")
        print("  1. Log in to https://dashboard.uptimerobot.com/")
        print("  2. Go to 'Integrations' or 'My Settings' -> 'API Settings'")
        print("  3. Create or copy your 'Main API Key'")
        sys.exit(1)

    if args.status:
        print("\nFetching existing monitors from UptimeRobot...")
        res = await keepalive_service.fetch_uptimerobot_monitors(api_key)
        if res.get("success"):
            monitors = res.get("data", {}).get("monitors", [])
            print(f"Found {len(monitors)} monitor(s):")
            for m in monitors:
                print(f"  - [{m.get('status')}] {m.get('friendly_name')} -> {m.get('url')}")
        else:
            print(f"[FAILED] {res.get('error')}")
        return

    print("\nRegistering monitor with UptimeRobot...")
    res = await keepalive_service.create_or_verify_uptimerobot_monitor(
        api_key=api_key,
        monitor_url=target_url,
        friendly_name=args.name,
        interval=args.interval
    )

    if res.get("success"):
        print("\n[SUCCESS] Monitor successfully configured on UptimeRobot!")
        print(f"Message: {res.get('message')}")
        print("\nRender free tier will now be pinged every 5 minutes and will NEVER sleep!")
    else:
        print("\n[ERROR] Could not configure monitor:")
        print(f"Reason: {res.get('error')}")

if __name__ == "__main__":
    asyncio.run(main())
