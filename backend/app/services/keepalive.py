"""
Keep-Alive and UptimeRobot Bot Service.
Prevents Render free tier instances from sleeping by:
1. Running an asynchronous self-ping loop pinging the public URL every 10 minutes.
2. Integrating with UptimeRobot API (https://dashboard.uptimerobot.com/) to automatically configure/verify monitors.
"""
import asyncio
from datetime import datetime, timezone
import logging
from typing import Optional, Dict, Any
import httpx

from app.core.config import settings

logger = logging.getLogger("keepalive")
logger.setLevel(logging.INFO)

class KeepAliveManager:
    """Manages keep-alive background pinging and UptimeRobot integration."""

    def __init__(self):
        self.started_at: datetime = datetime.now(timezone.utc)
        self.last_ping_sent_at: Optional[datetime] = None
        self.last_ping_received_at: Optional[datetime] = None
        self.last_ping_status: str = "initialized"
        self.total_pings_sent: int = 0
        self.total_pings_received: int = 0
        self.is_running: bool = False
        self.uptimerobot_info: Optional[Dict[str, Any]] = None
        self._task: Optional[asyncio.Task] = None

    def record_incoming_ping(self) -> None:
        """Invoked when an external bot or ping request hits /api/ping."""
        self.total_pings_received += 1
        self.last_ping_received_at = datetime.now(timezone.utc)

    def get_ping_url(self) -> str:
        """Determines the target public ping URL."""
        if settings.PING_ENDPOINT:
            return settings.PING_ENDPOINT
        base = settings.BASE_SERVER_URL.rstrip("/")
        return f"{base}/api/ping"

    async def send_ping(self) -> Dict[str, Any]:
        """Pings the public server endpoint to register activity with host (e.g. Render)."""
        url = self.get_ping_url()
        self.total_pings_sent += 1
        self.last_ping_sent_at = datetime.now(timezone.utc)

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, headers={"User-Agent": "GigScore-KeepAlive-Bot/2.0"})
                if response.status_code == 200:
                    self.last_ping_status = f"success ({response.status_code})"
                    logger.info(f"[KeepAlive] Ping successful to {url}: HTTP {response.status_code}")
                    return {"status": "success", "url": url, "code": response.status_code}
                else:
                    self.last_ping_status = f"warning (HTTP {response.status_code})"
                    logger.warning(f"[KeepAlive] Ping returned non-200: HTTP {response.status_code}")
                    return {"status": "warning", "url": url, "code": response.status_code}
        except Exception as exc:
            self.last_ping_status = f"error: {str(exc)}"
            logger.error(f"[KeepAlive] Ping failed to {url}: {exc}")
            return {"status": "error", "url": url, "error": str(exc)}

    async def _ping_loop(self) -> None:
        """Internal background loop running every N minutes."""
        # Initial wait before starting first ping (allows full startup)
        await asyncio.sleep(15)

        interval_seconds = max(60, settings.SELF_PING_INTERVAL_MINUTES * 60)
        logger.info(f"[KeepAlive] Background self-ping loop started. Target: {self.get_ping_url()} every {settings.SELF_PING_INTERVAL_MINUTES} min.")

        while self.is_running:
            try:
                await self.send_ping()
            except Exception as e:
                logger.error(f"[KeepAlive] Unexpected error in ping loop: {e}")

            try:
                await asyncio.sleep(interval_seconds)
            except asyncio.CancelledError:
                break

    def start(self) -> None:
        """Starts the background ping worker task if enabled."""
        if not settings.ENABLE_SELF_PING:
            logger.info("[KeepAlive] Self-pinging is disabled in settings.")
            return

        if self.is_running:
            return

        self.is_running = True
        self._task = asyncio.create_task(self._ping_loop())

    def stop(self) -> None:
        """Stops the background ping worker task."""
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
            logger.info("[KeepAlive] Background ping worker stopped.")

    # -------------------------------------------------------------
    # UptimeRobot REST API Integration (https://dashboard.uptimerobot.com)
    # -------------------------------------------------------------
    async def create_or_verify_uptimerobot_monitor(
        self,
        api_key: Optional[str] = None,
        monitor_url: Optional[str] = None,
        friendly_name: str = "GigScore Backend Keep-Alive Bot",
        interval: int = 300
    ) -> Dict[str, Any]:
        """
        Creates or checks an HTTP monitor on UptimeRobot via their v2 API.
        Interval defaults to 300 seconds (5 minutes), which prevents Render from sleeping.
        """
        key = api_key or settings.UPTIMEROBOT_API_KEY
        if not key:
            return {
                "success": False,
                "error": "No UptimeRobot API key provided. Add UPTIMEROBOT_API_KEY in your environment or enter it manually."
            }

        target_url = monitor_url or self.get_ping_url()
        api_endpoint = "https://api.uptimerobot.com/v2/newMonitor"

        payload = {
            "api_key": key,
            "format": "json",
            "type": "1",  # 1 = HTTP(s)
            "url": target_url,
            "friendly_name": friendly_name,
            "interval": str(interval)  # 300 sec = 5 minutes
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    api_endpoint,
                    data=payload,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                data = res.json()

                if data.get("stat") == "ok":
                    monitor_id = data.get("monitor", {}).get("id")
                    self.uptimerobot_info = {
                        "registered": True,
                        "monitor_id": monitor_id,
                        "url": target_url,
                        "interval_seconds": interval,
                        "status": "Active monitor created on UptimeRobot"
                    }
                    logger.info(f"[UptimeRobot] Monitor successfully created! ID: {monitor_id}")
                    return {
                        "success": True,
                        "stat": "ok",
                        "message": "UptimeRobot monitor created successfully!",
                        "monitor": data.get("monitor")
                    }

                # Check if it already exists
                error_msg = str(data.get("error", {}).get("message", ""))
                if "already exists" in error_msg.lower():
                    logger.info(f"[UptimeRobot] Monitor already exists for {target_url}.")
                    # Verify existing monitors
                    monitors_check = await self.fetch_uptimerobot_monitors(key)
                    self.uptimerobot_info = {
                        "registered": True,
                        "url": target_url,
                        "status": "Monitor is already registered and active on UptimeRobot"
                    }
                    return {
                        "success": True,
                        "stat": "ok",
                        "message": f"Monitor already registered on UptimeRobot for {target_url}.",
                        "details": monitors_check
                    }

                return {
                    "success": False,
                    "error": error_msg or data,
                    "raw": data
                }

        except Exception as e:
            logger.error(f"[UptimeRobot] API request error: {e}")
            return {
                "success": False,
                "error": f"Failed to connect to UptimeRobot API: {str(e)}"
            }

    async def fetch_uptimerobot_monitors(self, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Fetches existing monitors from UptimeRobot."""
        key = api_key or settings.UPTIMEROBOT_API_KEY
        if not key:
            return {"success": False, "error": "No API key provided."}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.uptimerobot.com/v2/getMonitors",
                    data={"api_key": key, "format": "json"},
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                data = res.json()
                return {"success": data.get("stat") == "ok", "data": data}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive keep-alive and anti-sleep status metrics."""
        now = datetime.now(timezone.utc)
        uptime_seconds = int((now - self.started_at).total_seconds())

        return {
            "status": "active" if self.is_running else "inactive",
            "server_uptime_seconds": uptime_seconds,
            "target_ping_url": self.get_ping_url(),
            "self_ping": {
                "enabled": settings.ENABLE_SELF_PING,
                "interval_minutes": settings.SELF_PING_INTERVAL_MINUTES,
                "total_pings_sent": self.total_pings_sent,
                "last_ping_sent_at": self.last_ping_sent_at.isoformat() if self.last_ping_sent_at else None,
                "last_ping_status": self.last_ping_status
            },
            "external_monitoring": {
                "total_pings_received": self.total_pings_received,
                "last_ping_received_at": self.last_ping_received_at.isoformat() if self.last_ping_received_at else None,
                "uptimerobot_configured": bool(settings.UPTIMEROBOT_API_KEY or self.uptimerobot_info),
                "uptimerobot_info": self.uptimerobot_info
            },
            "instructions": {
                "uptimerobot_dashboard": "https://dashboard.uptimerobot.com/",
                "monitor_type": "HTTP(s)",
                "recommended_url": self.get_ping_url(),
                "recommended_interval": "5 minutes (300 seconds)"
            }
        }

# Global singleton
keepalive_service = KeepAliveManager()
