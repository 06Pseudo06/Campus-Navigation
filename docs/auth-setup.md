# CampusWay Authentication Setup & Production Guide

**Document Type:** Operator & Developer Setup Runbook  
**Target Environment:** Local Docker Compose / Production Cloud  
**Confidentiality:** Security-Hardened (No Secrets or Credential Values Included)  

---

## 1. Quick Start: Local Development with Docker

To run the full stack with PostgreSQL, FastAPI, and Next.js:

```bash
# 1. Start the PostgreSQL database and backend service
docker-compose up -d postgres backend

# 2. Run database migrations to apply latest authentication schemas
docker-compose exec backend alembic upgrade head

# 3. Start the Next.js frontend development server
npm --prefix frontend run dev
```

The frontend will run at `http://localhost:3000` and the backend at `http://localhost:8000`.

---

## 2. Environment Variables Configuration

Create a `.env` file in the root and in `backend/` using the template below. **Never commit actual secrets or keys to version control.**

```bash
# Copy example templates
cp .env.example .env
cp backend/.env.example backend/.env
```

### Required Variable Names:

| Variable Name | Required By | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Backend | PostgreSQL connection URI |
| `JWT_SECRET_KEY` | Backend | Cryptographic secret for signing tokens |
| `ADMIN_API_KEY` | Backend | Administrative header key for bulk endpoints |
| `CORS_ORIGINS` | Backend | Comma-separated list of allowed frontend origins |
| `NEXT_PUBLIC_API_URL` | Frontend | API URL reachable from client browser |
| `GOOGLE_CLIENT_ID` | Both | Google Cloud OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Backend | Google Cloud OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | Backend | Authorized redirect URI for Google OAuth callback |
| `TWILIO_ACCOUNT_SID` | Backend (Optional) | SMS gateway account identifier |
| `TWILIO_AUTH_TOKEN` | Backend (Optional) | SMS gateway authorization token |
| `TWILIO_PHONE_NUMBER`| Backend (Optional) | Outbound phone number for SMS passcodes |
| `SMTP_HOST` | Backend (Optional) | Transactional email server host |
| `SMTP_PORT` | Backend (Optional) | Transactional email server port |
| `SMTP_USER` | Backend (Optional) | Transactional email username |
| `SMTP_PASSWORD` | Backend (Optional) | Transactional email password |

---

## 3. Configuring Google OAuth 2.0

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g., `CampusWay Navigation`).
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth client ID**.
5. Select Application Type: **Web application**.
6. Set **Authorized JavaScript origins**:
   - Development: `http://localhost:3000`, `http://127.0.0.1:3000`
   - Production: `https://your-production-domain.com`
7. Set **Authorized redirect URIs**:
   - Development: `http://localhost:3000/auth/google/callback` and `http://localhost:8000/auth/google/callback`
   - Production: `https://your-production-domain.com/auth/google/callback`
8. Copy the **Client ID** into `GOOGLE_CLIENT_ID` and **Client Secret** into `GOOGLE_CLIENT_SECRET`.

---

## 4. Development Fallback Mode (Zero Third-Party Cost)

When `ENVIRONMENT=development` (default in local dev):
- **Phone OTP:** One-time verification passcodes are generated cryptographically and printed to the terminal console (`[DEV OTP DISPATCH] Passcode for +1234567890: 123456`). No paid SMS gateway is required.
- **Email Verification:** Account verification tokens and password reset links are logged to the backend console.
- **Google OAuth:** If Google credentials are unconfigured, the UI gracefully informs the visitor and permits one-click Guest Explorer or email sign-up.

---

## 5. Switching Providers in Production

To transition from dev-fallback to production services:
- **For SMS OTP:** Update `backend/app/services/auth_providers.py` to instantiate `TwilioClient(account_sid, auth_token)` when `TWILIO_ACCOUNT_SID` is present.
- **For Transactional Emails:** Configure `SMTP_HOST` or connect an API service such as Resend (`RESEND_API_KEY`) in `backend/app/services/email_service.py`.

