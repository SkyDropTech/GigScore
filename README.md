# 🚀 GigScore: Explainable Alternative Credit Risk Assessment for Gig Workers

> **A modern, full-stack fintech platform that translates gig-platform ride telemetry, income stability, and banking cash flows into an explainable 300–900 alternative credit score powered by Calibrated XGBoost & TreeSHAP on MongoDB Atlas.**

---

## 📌 Table of Contents
1. [Admin & Demo Login Credentials](#1-admin--demo-login-credentials)
2. [ChatGPT Prompt: Generate Compliant PDF Statements](#2-chatgpt-prompt-generate-compliant-pdf-statements)
3. [Full Project Deployment on Vercel](#3-full-project-deployment-on-vercel)
4. [Local Development Setup](#4-local-development-setup)
5. [Architecture & Machine Learning Engine](#5-architecture--machine-learning-engine)
6. [API Endpoints Reference](#6-api-endpoints-reference)

---

## 1. Admin & Demo Login Credentials

You can log into GigScore using two distinct portals:
- **Admin & Underwriting Portal**: `http://localhost:5173/login/admin`
- **Driver Self-Service Portal**: `http://localhost:5173/login/driver`

### 🔑 Administrator & Senior Underwriter Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Senior Underwriter / Admin** | `admin@gigscore.com` | `Admin@123456` | Full Underwriting Queue, Sanction Slider, MLOps, System Health, Audit Logs |
| **Admin (Alternative)** | `admin@gigscore.demo` | `password123` | Full Admin & MLOps Console |
| **Credit Underwriter** | `priya.underwriter@gigscore.demo` | `password123` | Credit Assessment & Loan Review Queue |

> **💡 Quick Tip**: On the Admin Login page, you can click the **"Quick Fill Underwriter Demo"** button to auto-fill the credentials in 1 click!

---

### 🚗 Pre-Seeded Driver Personas (Password: `password123`)

| Driver Name | Email | Platform | Profile & Archetype | Initial Credit Grade |
|---|---|---|---|---|
| **Rahul Sharma** | `rahul.sharma@gigscore.demo` | Ola & Uber (Dzire, BLR) | High & Consistent Earner (₹54k/mo, 96% comp.) | **873 (Prime)** |
| **Rajesh Kumar** | `rajesh.kumar@gigscore.demo` | Ola Fleet (Dzire, BLR) | Stable High Tenure (36 mos, ₹54k/mo) | **855 (Prime)** |
| **Amit Shinde** | `amit.shinde@gigscore.demo` | Uber Go (WagonR, BOM) | Moderate Volatile (₹38k/mo, 8% canc.) | **727 (Near-Prime)** |
| **Suresh Yadav** | `suresh.yadav@gigscore.demo` | Ola Auto (Mumbai) | Top Performer (₹68k/mo, 520 trips/mo) | **885 (Prime)** |
| **Imran Khan** | `imran.khan@gigscore.demo` | Uber Moto (DEL) | Irregular / High Cancellation (₹16k/mo, 23% canc.) | **340 (Subprime)** |

---

## 2. ChatGPT Prompt: Generate Compliant PDF Statements

GigScore features an automated **PDF Ingestion & Telemetry Parser Engine** (`pypdf` + regex extraction). It scans driver earnings statements for name, platform, active days, trip counts, completion rates, and monthly revenue.

### 📋 Copy & Paste This Prompt into ChatGPT:

Copy the exact block below and paste it into **ChatGPT (GPT-4o or ChatGPT with Python Code Interpreter)** to have it generate and download a compliant statement PDF:

```text
Please write and execute a Python script using ReportLab to generate and give me a downloadable PDF file named "Rishikesh_Shedge_Verified_Statement.pdf".

The PDF must contain the exact structure and text headers below so that our credit assessment regex engine can parse it:

---
[DOCUMENT HEADER]
Title: GIG-ECONOMY OPERATIONAL TELEMETRY & EARNINGS STATEMENT
Subtitle: Verified Aggregate Statement via Setu Account Aggregator & Platform API Gateway

[DRIVER METADATA BLOCK]
Driver: Rishikesh Shedge
Driver ID: DRV-884210
Platform: Uber & Ola Fleet
City: Pune
Vehicle: Sedan (Maruti Suzuki Dzire)
Period: 2024-01 to 2024-12
Verification Status: VERIFIED via DigiLocker & AA Sandbox

[ML FEATURE SUMMARY BLOCK]
avg_monthly_net_income: INR 52,400.00
income_std: INR 3,850.00
coefficient_of_variation: 0.073
min_income: INR 46,200.00
income_slope_3m: 0.042
recent_vs_historical_income: 1.08
estimated_disposable_income: INR 31,440.00
active_days_monthly: 26.0
trips_per_month: 440
trips_per_day: 16.9
completion_rate: 96.4%
cancellation_rate: 3.6%
avg_rating: 4.88 / 5

[12-MONTH TELEMETRY TABLE]
The table MUST have these exact column headers:
Month | Trips | Active_Days | Gross_Income | Platform_Fee | Other_Costs | Net_Income

Include these 12 rows formatted with INR currency:
2024-01 | 420 | 25 | INR 68,000.00 | INR 13,600.00 | INR 6,800.00 | INR 47,600.00
2024-02 | 435 | 26 | INR 70,500.00 | INR 14,100.00 | INR 7,050.00 | INR 49,350.00
2024-03 | 448 | 26 | INR 72,000.00 | INR 14,400.00 | INR 7,200.00 | INR 50,400.00
2024-04 | 430 | 25 | INR 69,200.00 | INR 13,840.00 | INR 6,920.00 | INR 48,440.00
2024-05 | 455 | 27 | INR 74,000.00 | INR 14,800.00 | INR 7,400.00 | INR 51,800.00
2024-06 | 442 | 26 | INR 71,800.00 | INR 14,360.00 | INR 7,180.00 | INR 50,260.00
2024-07 | 450 | 27 | INR 73,500.00 | INR 14,700.00 | INR 7,350.00 | INR 51,450.00
2024-08 | 460 | 27 | INR 75,000.00 | INR 15,000.00 | INR 7,500.00 | INR 52,500.00
2024-09 | 438 | 26 | INR 71,200.00 | INR 14,240.00 | INR 7,120.00 | INR 49,840.00
2024-10 | 465 | 28 | INR 76,400.00 | INR 15,280.00 | INR 7,640.00 | INR 53,480.00
2024-11 | 470 | 28 | INR 78,000.00 | INR 15,600.00 | INR 7,800.00 | INR 54,600.00
2024-12 | 485 | 28 | INR 81,500.00 | INR 16,300.00 | INR 8,150.00 | INR 57,050.00

[SECURITY & SIGNATURE FOOTER]
Digital Signature: SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
Issuer: Setu AA Sandbox Gateway / UIDAI Verified
---

Please generate this PDF with clean styling (fintech blue theme, nice typography) and provide the download link.
```

---

## 3. Full Project Deployment on Vercel

GigScore is architected as a decoupled modern web application:
- **Frontend (React 19 + Vite)**: Deployed to **Vercel Global Edge CDN**.
- **Database**: Cloud-hosted on **MongoDB Atlas**.
- **Backend (FastAPI + XGBoost + TreeSHAP)**: Deployed to **Render**, **Railway**, **Fly.io**, or an **AWS/DigitalOcean VPS** (due to binary ML libraries like `xgboost` and `scikit-learn` exceeding Vercel Serverless Function package size limits).

---

### Step 1: Deploy Frontend to Vercel

1. Push your project to GitHub / GitLab:
   ```bash
   git add .
   git commit -m "Deploy GigScore to Vercel"
   git push origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New..."** → **"Project"**.
3. Import your **GigScore** repository.
4. **Vercel Project Settings**:
   - **Framework Preset**: `Vite` (automatically detected from `package.json` and `vercel.json`).
   - **Root Directory**: Leave as `./` (or choose `frontend` if deploying frontend-only).
   - **Build Command**: `cd frontend && npm install && npm run build` (automatic).
   - **Output Directory**: `frontend/dist` (automatic).
5. **Environment Variables** in Vercel Settings:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-api.onrender.com` (your deployed FastAPI URL).
6. Click **Deploy**! Vercel will build and assign you a live HTTPS domain (`https://gigscore.vercel.app`).

---

### Step 2: Deploy Backend (e.g. Render.com / Railway)

1. Go to [Render Dashboard](https://dashboard.render.com) and select **"New Web Service"**.
2. Connect your **GigScore** Git repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Add Environment Variables** in Render:
   ```env
   MONGO_URI=mongodb+srv://Skydrop:Skydrop123@booklibrary.gpib5sv.mongodb.net/gigscore?retryWrites=true&w=majority&appName=BookLibrary
   MONGODB_URL=mongodb+srv://Skydrop:Skydrop123@booklibrary.gpib5sv.mongodb.net/gigscore?retryWrites=true&w=majority&appName=BookLibrary
   MONGODB_DB_NAME=gigscore
   SECRET_KEY=gigscore_super_secret_jwt_key_2026_production_grade
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   CLOUDINARY_CLOUD_NAME=gigscore-cloud
   CLOUDINARY_API_KEY=233318421214557
   CLOUDINARY_API_SECRET=CrEp-Xr6vhp-LTQsp3uwin68g0k
   ```
5. Click **Create Web Service**. Once deployed, copy your Render URL and add it as `VITE_API_URL` in your Vercel project settings.

---

## 4. Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Server: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup:
```powershell
cd frontend
npm install
npm run dev
```
- Web App: `http://localhost:5173`

---

## 5. Architecture & Machine Learning Engine

```
[Driver App / Bank AA] ──> [FastAPI Telemetry Ingest] ──> [MongoDB Atlas Cluster]
                                       │
                                       ▼
                       [Feature Transformation Engine]
                         (CV, 3M Slope, Ratings, Comp%)
                                       │
                                       ▼
                         [Calibrated XGBoost Model]
                                       │
                                       ▼
              [TreeSHAP Reason Codes] + [300-900 Credit Grade]
                                       │
                                       ▼
                     [Underwriting Decision Gate]
                  (Dynamic Sanction Slider & Policy Audit)
```

### Probability to Score Translation
Alternative credit scores are generated on the standard 300–900 scale:
$$\text{Score} = \text{clamp}\left(900 - (P(\text{Default}) \times 600), 300, 900\right)$$

- **LOW RISK (Prime)**: Score $\ge 750$ ($P(\text{Default}) < 15\%$)
- **MEDIUM RISK (Near-Prime)**: Score $600 - 749$ ($15\% \le P(\text{Default}) < 35\%$)
- **HIGH RISK (Subprime)**: Score $< 600$ ($P(\text{Default}) \ge 35\%$)

---

## 6. API Endpoints Reference

### 🔐 Authentication & Session
- `POST /api/auth/register` — Register driver or underwriter.
- `POST /api/auth/login` — Authenticate and receive JWT access token.
- `GET /api/users/me` — Fetch current user profile.
- `GET /api/demo/personas` — Fetch pre-seeded demo accounts.
- `POST /api/demo/reset` — Reset database to pristine state.

### 🚗 Driver Operations
- `POST /api/drivers/me/upload-statement` — Upload earnings PDF statement.
- `POST /api/drivers/me/ingest` — Parse and ingest statement telemetry into MongoDB.
- `GET /api/drivers/me/summary` — Key stability metrics and latest score.
- `GET /api/drivers/me/earnings` — 12-month earnings, fees, and trip breakdown.

### 🏦 Loans & Underwriting
- `POST /api/loans` — Apply for a loan (triggers real-time XGBoost scoring).
- `GET /api/loans` — List active loans.
- `GET /api/lender/applications` — Underwriting review queue.
- `POST /api/lender/applications/{id}/review` — Manual approval, sanction amount override, or denial.
- `GET /api/lender/portfolio` — Portfolio exposure, sanction volume, and default rates.
