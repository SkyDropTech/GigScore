# Vercel Deployment Guide for GigScore

This guide explains how to deploy **GigScore** to **Vercel** with the MongoDB Atlas cloud database.

---

## 1. MongoDB Database Status
The project is configured to use your MongoDB Atlas cluster:
- **URI**: `mongodb+srv://Skydrop:Skydrop123@booklibrary.gpib5sv.mongodb.net/focusdesk?retryWrites=true&w=majority&appName=BookLibrary`
- **Database**: `focusdesk`
- **Status**: Verified & Seeded with demo personas, ML risk assessment models, loan records, and audit logs.

---

## 2. Deploying to Vercel

### Recommended Architecture
- **Frontend (React + Vite)**: Hosted on **Vercel** (Global CDN, instant cache, fast SPA routing).
- **Backend (FastAPI + ML Models)**: Hosted on a Python-friendly container host like **Render**, **Railway**, **Fly.io**, or **AWS/VPS** (because XGBoost, SHAP, and Scikit-Learn binaries exceed Vercel's serverless function package limit).

---

### Step A: Push Code to GitHub / Git Provider
Ensure your repository is pushed to your GitHub or GitLab account:
```bash
git add .
git commit -m "Configure MongoDB Atlas and Vercel environment"
git push origin main
```

---

### Step B: Deploy on Vercel

1. Log in to [Vercel](https://vercel.com) and click **"Add New..."** -> **"Project"**.
2. Select your **GigScore** repository and click **Import**.
3. **Project Configuration**:
   - **Framework Preset**: `Vite` (Vercel automatically detects this from `vercel.json` / `package.json`).
   - **Root Directory**: Leave as `./` (or select `frontend` if deploying frontend-only).
   - **Build Command**: `cd frontend && npm install && npm run build` (detected automatically).
   - **Output Directory**: `frontend/dist` (detected automatically).
4. **Environment Variables**:
   Add the following environment variable in the Vercel dashboard:

   | Key | Value | Description |
   | --- | --- | --- |
   | `VITE_API_URL` | `https://your-backend-api.onrender.com` | URL of your deployed FastAPI backend (leave blank if running proxy rewrites) |

5. Click **Deploy**.

---

### Step C: Deploy Backend (e.g. on Render / Railway)

If hosting the backend on [Render.com](https://render.com) (free/easy web service):
1. Create a **New Web Service** pointing to the same repo.
2. Settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables**:
   ```env
   MONGO_URI=mongodb+srv://Skydrop:Skydrop123@booklibrary.gpib5sv.mongodb.net/focusdesk?retryWrites=true&w=majority&appName=BookLibrary
   MONGODB_URL=mongodb+srv://Skydrop:Skydrop123@booklibrary.gpib5sv.mongodb.net/focusdesk?retryWrites=true&w=majority&appName=BookLibrary
   MONGODB_DB_NAME=focusdesk
   SECRET_KEY=gigscore_super_secret_jwt_key_2026_production_grade
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   CLOUDINARY_CLOUD_NAME=gigscore-cloud
   CLOUDINARY_API_KEY=233318421214557
   CLOUDINARY_API_SECRET=CrEp-Xr6vhp-LTQsp3uwin68g0k
   ```
4. Copy the backend URL (e.g. `https://gigscore-backend-kpio.onrender.com`) and paste it as `VITE_API_URL` in your Vercel Project settings.

---

## 4. Preventing Render Sleep (UptimeRobot Keep-Alive Bot)

Render free instances sleep after 15 minutes of inactivity. To keep it awake 24/7 without delays:
1. Go to [https://dashboard.uptimerobot.com/](https://dashboard.uptimerobot.com/)
2. Add New Monitor -> **HTTP(s)**
3. URL: `https://gigscore-backend-kpio.onrender.com/api/ping`
4. Interval: **5 minutes**
5. Done! The backend will be pinged automatically, preventing sleep.

See [RENDER_KEEPALIVE_UPTIMEROBOT_GUIDE.md](file:///d:/GigScore/RENDER_KEEPALIVE_UPTIMEROBOT_GUIDE.md) for full details and automated API setup.

---

## 5. Files Added / Updated for Vercel & KeepAlive

- [`backend/.env`](file:///d:/GigScore/backend/.env): Updated with MongoDB Atlas URI and database `focusdesk`.
- [`backend/.env.example`](file:///d:/GigScore/backend/.env.example): Updated with `MONGO_URI` template.
- [`backend/app/core/config.py`](file:///d:/GigScore/backend/app/core/config.py): Supports both `MONGO_URI` and `MONGODB_URL`.
- [`backend/app/db/mongodb.py`](file:///d:/GigScore/backend/app/db/mongodb.py): Uses default database from URI or fallback.
- [`frontend/src/services/api.js`](file:///d:/GigScore/frontend/src/services/api.js): Dynamic API URL configuration via `VITE_API_URL`.
- [`frontend/vercel.json`](file:///d:/GigScore/frontend/vercel.json): Handles SPA client-side routing on Vercel.
- [`vercel.json`](file:///d:/GigScore/vercel.json): Root Vercel build and routing configuration.
- [`package.json`](file:///d:/GigScore/package.json): Root build script for Vercel auto-detection.
- [`.gitignore`](file:///d:/GigScore/.gitignore): Protects `.env` files and caches from Git commit.
