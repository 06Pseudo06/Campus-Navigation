# CampusWay — Local Environment Setup Guide

## 1. Prerequisites

Before setting up the backend locally, ensure you have installed:
- **Python**: 3.12 or 3.13 (64-bit)
- **PostgreSQL**: 16+ (Local service, Docker container, or Neon Cloud instance)
- **Git**: For version control
- **Docker & Docker Compose** (Optional, for containerized run)

---

## 2. Step-by-Step Local Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/06Pseudo06/Campus-Navigation.git
cd Campus-Navigation
```

### Step 2: Create Python Virtual Environment
**On Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On Linux / macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Backend Dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Environment Variable Configuration

Create a `.env` file in the `backend/` directory based on `.env.example`:

```bash
cp .env.example .env
```

### Environment Variable Reference

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://postgres:postgres@localhost:5432/campusway_db` | Connection string for PostgreSQL or Neon cloud DB |
| `PROJECT_NAME` | No | `CampusWay Route Intelligence Service` | Application title reported in Swagger UI and healthcheck |
| `API_V1_STR` | No | `/api/v1` | URL routing prefix for API endpoints |
| `ADMIN_API_KEY` | **Yes** | *(Change in production)* | Administrative secret key for automation and management |
| `JWT_SECRET_KEY` | **Yes** | *(Change in production)* | Secret key used to sign HS256 JWT and QR code tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` (24 hours) | Expiry duration for user access tokens |
| `CORS_ORIGINS` | No | `["http://localhost:3000","http://127.0.0.1:3000"]` | Allowed origins for web client CORS requests |
| `DEFAULT_WALKING_SPEED_MPS`| No | `1.3` | Average walking speed in meters/second for walking time calculation |
| `GOOGLE_CLIENT_ID` | No | `None` | Google OAuth 2.0 Web Client ID for SSO |
| `TWILIO_ACCOUNT_SID` | No | `None` | Twilio Account SID for SMS OTP delivery |
| `TWILIO_AUTH_TOKEN` | No | `None` | Twilio Auth Token |
| `TWILIO_FROM_PHONE` | No | `None` | Twilio sender phone number |

> [!WARNING]
> Never commit actual production database connection strings, JWT secret keys, or OAuth client secrets to version control.

---

## 4. Running Database Migrations

Apply the latest database migrations using Alembic:

```powershell
# From the backend/ directory with virtualenv active:
alembic upgrade head
```

To verify current migration status:
```powershell
alembic current
```

---

## 5. Starting the Backend Server

Run the development server with live reload:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Verify Availability:
- Health check: `http://localhost:8000/health` -> `{"status":"healthy","service":"CampusWay..."}`
- Interactive API Docs: `http://localhost:8000/api/v1/docs`
- ReDoc Documentation: `http://localhost:8000/api/v1/redoc`
