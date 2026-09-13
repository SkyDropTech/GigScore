# Render Anti-Sleep & UptimeRobot Bot Guide

## 1. The Problem: Render Free-Tier Sleeping
Web services hosted on Render's free tier automatically spin down (sleep) after **15 minutes of inactivity**. 
When a user visits your GigScore frontend, the first API request encounters a **cold start latency of 30–60 seconds** or times out.

---

## 2. The Complete Solution
GigScore now includes a multi-tier keep-alive system to keep the Render backend awake 24/7:

1. **External UptimeRobot Bot (Recommended)**: Pings `https://gigscore-backend-kpio.onrender.com/api/ping` every 5 minutes from the cloud.
2. **Internal Self-Ping Background Loop**: Pings itself every 10 minutes while running.
3. **Ultra-Fast Endpoint (`/api/ping`)**: Lightweight endpoint returning `200 OK` in <10ms without database overhead.

---

## 3. Option A: Setup via UptimeRobot Dashboard (2 Minutes)

Follow these simple steps on [UptimeRobot Dashboard](https://dashboard.uptimerobot.com/):

1. Go to **[https://dashboard.uptimerobot.com/](https://dashboard.uptimerobot.com/)** and log in (or register for free).
2. In the dashboard, click the blue **"+ Add New Monitor"** button.
3. Fill in the monitor settings:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `GigScore Backend Keep-Alive`
   - **URL (or IP)**: `https://gigscore-backend-kpio.onrender.com/api/ping`
   - **Monitoring Interval**: `Every 5 minutes` (free tier default)
   - **Monitor Timeout**: `30 seconds`
4. Click **"Create Monitor"**.

> **Result**: UptimeRobot will ping your backend every 5 minutes. Render will recognize the traffic and **never go to sleep**!

---

## 4. Option B: Automated Setup via UptimeRobot API

If you prefer 100% automated setup without manually clicking buttons in the dashboard:

1. In UptimeRobot, go to **My Settings** -> **API Settings** (or [Integrations](https://dashboard.uptimerobot.com/my/api)).
2. Click **Create Main API Key** and copy it.
3. Add the key to your Render environment variables or backend `.env`:
   ```bash
   UPTIMEROBOT_API_KEY=u1234567-abcdef1234567890abcdef
   ```
4. Whenever the backend boots on Render, it will automatically register the monitor on UptimeRobot!

Or run the setup script locally:
```bash
cd backend
python scripts/setup_uptimerobot.py --api-key <YOUR_MAIN_API_KEY>
```

---

## 5. Option C: Trigger from REST API

You can also trigger monitor creation directly via an HTTP request:

```bash
curl -X POST https://gigscore-backend-kpio.onrender.com/api/keepalive/setup-uptimerobot \
  -H "Content-Type: application/json" \
  -d '{"api_key": "YOUR_UPTIMEROBOT_API_KEY"}'
```

---

## 6. How to Verify It's Working

### A. Test Ping Endpoint
Open in browser or run:
```bash
curl https://gigscore-backend-kpio.onrender.com/api/ping
```
**Response**:
```json
{
  "status": "ok",
  "message": "pong",
  "service": "gigscore-backend",
  "timestamp": "2026-09-13T04:25:30.123456+00:00",
  "bot_target": "https://gigscore-backend-kpio.onrender.com/api/ping"
}
```

### B. Inspect Keep-Alive & Bot Status
```bash
curl https://gigscore-backend-kpio.onrender.com/api/keepalive/status
```
Returns uptime, number of self-pings sent, number of external bot pings received, and UptimeRobot integration status.

---

## Summary of Environment Variables (Optional)

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_SERVER_URL` | `https://gigscore-backend-kpio.onrender.com` | Your public backend URL |
| `ENABLE_SELF_PING` | `true` | Enables/disables internal keep-alive loop |
| `SELF_PING_INTERVAL_MINUTES` | `10` | Frequency of self-pings (must be < 15) |
| `UPTIMEROBOT_API_KEY` | *(empty)* | Automatically sets up monitor on UptimeRobot |
