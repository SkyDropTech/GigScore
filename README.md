# GigScore: Explainable Alternative Credit Risk Assessment for Gig-Economy Workers

> **A full-stack, auditable lending-assessment platform that converts consented gig-work, income stability, and ride quality data into a transparent 300–900 alternative credit score.**

---

## 1. Problem Overview & Target Definition
Traditional banking credit models (CIBIL, Experian, FICO) heavily penalize or reject gig-economy workers (rideshare drivers, food/grocery delivery partners) due to lack of fixed salary slips, irregular daily cashflows, and non-traditional working hours.

**GigScore Solution**:
With explicit user consent, GigScore aggregates alternative operational indicators:
- **Income Consistency & Volatility**: Monthly net take-home, income standard deviation, coefficient of variation (CV), 3-month growth trajectory.
- **Work Commitment & Tenure**: Verified gig platform tenure, active working days per month, completed trips per active day.
- **Service Quality & Behavioral Risk**: Ride completion rate, driver-initiated cancellation rate, passenger rating.
- **Affordability Engine**: Net disposable income estimation and loan EMI debt-service ratios.

**Target Definition**:
- `target=1`: Borrower defaults or incurs 60+ days delinquency within a defined observation window.
- `target=0`: Borrower successfully services loan repayments.

---

## 2. Technology Stack & Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 8 + Custom Dark Fintech Glassmorphic CSS + Lucide Icons |
| **Backend** | Python 3.14 + FastAPI + Pydantic V2 + SQLAlchemy |
| **Database** | SQLite (Default for zero-setup single-command run) / PostgreSQL compatible |
| **ML & Explainability** | Pandas + scikit-learn + XGBoost 3.4 + TreeSHAP 0.52 + Probability Calibration |
| **Security & Auth** | JWT Access Tokens + Salted Password Hashing + Role-Based Access Control (RBAC) |
| **Governance** | Immutable System Audit Logging + Purpose-Specific Consent Revocation |

---

## 3. Demo Persona Scenarios

GigScore comes pre-seeded with 5 representative personas accessible via the top 1-click switcher:

1. 🚗 **Rajesh Kumar (Stable High Earner • Score: 873 • LOW RISK)**
   - Platform: Uber & Ola (Sedan, Bengaluru)
   - Profile: 36 months tenure, ₹62k/mo net earnings, low volatility (CV: 0.08), 27 active days/mo, 96% completion rate, 4.89★ rating.
   - Result: Pre-approved limit up to ₹3,00,000; Decision: `ELIGIBLE`.
   - Top SHAP Factor: *"Remarkable earnings stability month-over-month (low volatility: 0.08)"*.

2. 🛵 **Amit Verma (Moderate Volatile Earner • Score: 727 • MEDIUM RISK)**
   - Platform: Swiggy & Zomato (Two-Wheeler, Delhi NCR)
   - Profile: 15 months tenure, ₹38k/mo net earnings, moderate variance, 22 active days/mo, 89% completion rate, 4.68★ rating.
   - Result: Eligible for limit up to ₹1,20,000; Decision: `MANUAL_REVIEW`.
   - Top SHAP Factor: *"High commitment with 22 active working days per month"*.

3. 🛺 **Suresh Yadav (Declining High Risk • Score: 340 • HIGH RISK)**
   - Platform: Ola (Auto Rickshaw, Mumbai)
   - Profile: 8 months tenure, ₹21k/mo net earnings, sharp negative 3-month slope (-22%), 23% cancellation rate, 4.32★ rating.
   - Result: Decision: `NOT_ELIGIBLE`.
   - Top SHAP Factor: *"Elevated cancellation rate (23.0%), signaling work disruptions"*.

4. 🏦 **Priya Sharma (Senior Credit Underwriter)**
   - Access to Lender Underwriting Queue, deep applicant inspection drawer, TreeSHAP waterfall charts, and portfolio risk distribution.

5. ⚙️ **Aditya Nair (MLOps & Compliance Admin)**
   - Model Registry (`xgb-v3.2-calibrated`), ROC-AUC (0.956), PR-AUC (0.921), Brier Calibration (0.061), and complete immutable audit trail.

---

## 4. Machine Learning Pipeline & Progression

### Model Progression & Comparison
| Stage | Model | ROC-AUC | PR-AUC | Brier Score | Purpose |
|---|---|---|---|---|---|
| **Baseline 1** | Logistic Regression | 0.9638 | 0.9288 | 0.0821 | Interpretable linear baseline |
| **Baseline 2** | Random Forest | 0.9586 | 0.9207 | 0.0743 | Nonlinear feature interaction benchmark |
| **Champion** | **Calibrated XGBoost (v3.2)** | **0.9565** | **0.9217** | **0.0614** | Calibrated risk estimation & TreeSHAP |

### Probability to Score Translation
Alternative credit scores are generated on the standard 300–900 scale:
$$\text{Score} = \text{clamp}\left(900 - (P(\text{Default}) \times 600), 300, 900\right)$$

- **LOW RISK (Prime)**: Score $\ge 750$ ($P(\text{Default}) < 15\%$)
- **MEDIUM RISK (Near-Prime)**: Score $600 - 749$ ($15\% \le P(\text{Default}) < 35\%$)
- **HIGH RISK (Subprime)**: Score $< 600$ ($P(\text{Default}) \ge 35\%$)

---

## 5. API Endpoints

### Authentication & Profiles
- `POST /api/auth/register` - Create user account and driver profile.
- `POST /api/auth/login` - Authenticate and receive JWT access token.
- `GET /api/users/me` - Fetch authenticated user profile.
- `GET /api/demo/personas` - Retrieve pre-seeded demo accounts with ready tokens.
- `POST /api/demo/reset` - Re-seed database with fresh sample loans.

### Driver Operations & Consents
- `GET /api/drivers/me/summary` - Key metrics, latest score, and consent state.
- `GET /api/drivers/me/earnings` - 12-month net income, fees, and trip records.
- `GET /api/consents` - Active and past data access consents.
- `POST /api/consents` - Grant data access consent.
- `DELETE /api/consents/{id}` - Revoke data consent.
- `POST /api/data/import` - Ingest CSV ride and earning records.

### Loans & Assessments
- `POST /api/loans` - Submit loan application (automatically triggers ML scoring).
- `GET /api/loans` - List user applications (or all applications for lenders).
- `GET /api/loans/{id}` - Fetch application status and assessment factors.
- `POST /api/loans/{id}/assess` - Trigger credit assessment.
- `GET /api/assessments/{id}` - Get score, default probability, and SHAP reason codes.

### Lender & Underwriting
- `GET /api/lender/applications` - Filterable queue (by status, risk band, name).
- `POST /api/lender/applications/{id}/review` - Approve, reject, or request info with underwriter notes.
- `GET /api/lender/portfolio` - Portfolio default rate, exposure, and risk distribution.

### Governance & MLOps
- `GET /api/admin/models` - Active models in registry and evaluation artifacts.
- `GET /api/admin/metrics` - Model evaluation report and feature importances.
- `GET /api/audit` - Searchable system audit trail.

---

## 6. Running Locally

### Bare-Metal Setup (Zero Config)

#### 1. Backend:
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API is live at `http://127.0.0.1:8000`
- Interactive OpenAPI Docs at `http://127.0.0.1:8000/docs`

#### 2. Frontend:
```powershell
cd frontend
npm install
npm run dev
```
- Web Application is live at `http://127.0.0.1:5173`

---

## 7. Automated Testing
Run the comprehensive unit and integration test suite:
```powershell
python -u backend/tests/test_api.py
```
All 8 integration tests validate:
- System health and demo persona provisioning
- Score range & risk band calibration across all 3 archetypes
- Underwriting review workflow & status transitions
- Immutable audit log emission
