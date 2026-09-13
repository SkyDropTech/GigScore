"""
Keep-Alive and UptimeRobot Bot API routes.
Provides ultra-lightweight ping endpoints and UptimeRobot monitor setup.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Response, status
from pydantic import BaseModel

from app.services.keepalive import keepalive_service

router = APIRouter(tags=["KeepAlive & Anti-Sleep"])

class UptimeRobotSetupRequest(BaseModel):
    api_key: Optional[str] = None
    friendly_name: Optional[str] = "GigScore Backend Keep-Alive Bot"
    monitor_url: Optional[str] = None

@router.get("/ping", status_code=status.HTTP_200_OK)
@router.head("/ping", status_code=status.HTTP_200_OK)
def ping():
    """
    Lightweight keep-alive ping endpoint designed specifically for UptimeRobot,
    self-ping background loops, and uptime bots.
    Accepts both GET and HEAD requests.
    """
    keepalive_service.record_incoming_ping()
    return {
        "status": "ok",
        "message": "pong",
        "service": "gigscore-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "bot_target": keepalive_service.get_ping_url()
    }

@router.get("/keepalive/status")
def keepalive_status():
    """
    Returns current anti-sleep status, statistics on pings sent/received,
    and instructions for configuring UptimeRobot.
    """
    return keepalive_service.get_status()

@router.post("/keepalive/setup-uptimerobot")
async def setup_uptimerobot(req: UptimeRobotSetupRequest):
    """
    Triggers automated HTTP monitor setup with UptimeRobot (https://dashboard.uptimerobot.com/).
    Pings the Render backend every 5 minutes so it never goes into sleep mode.
    """
    result = await keepalive_service.create_or_verify_uptimerobot_monitor(
        api_key=req.api_key,
        monitor_url=req.monitor_url,
        friendly_name=req.friendly_name or "GigScore Backend Keep-Alive Bot"
    )
    return result
