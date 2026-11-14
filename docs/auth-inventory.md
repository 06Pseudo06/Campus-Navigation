# CampusWay Authentication Infrastructure Inventory

**Document Type:** Architecture & Configuration Audit  
**Status:** Comprehensive Round 4 Discovery  
**Confidentiality:** Security-Hardened (No Secrets or Credential Values Included)  

---

## 1. Overview & Current State

CampusWay is designed as a **Guest-First (Zero-Login)** university wayfinding and routing system with an optional authenticated tier for cloud bookmark synchronization, persistent profile management, and crowdsourced reporting.

The application supports three authentication tiers:
1. **Unauthenticated / Guest Explorer (Default):** Complete offline wayfinding, Dijkstra/A* path calculation, interactive SVG vector map, and local bookmark persistence in browser `localStorage`.
2. **Local Credentials Tier:** Email + Password hashed with memory-hard **Argon2id**, server-side sessions with cryptographic SHA-256 token hashing in PostgreSQL (`user_sessions`), delivered in HTTP-only SameSite cookies.
3. **Federated & Mobile Tier:** Google Identity Services (OAuth 2.0 / OpenID Connect) and 6-digit phone SMS OTP verification with automatic development-mode console fallbacks.

---

## 2. Inventory: Existing Backend Components

| Component | File Path | Status | Capabilities |
| :--- | :--- | :--- | :--- |
| **Session & Google OAuth API** | `backend/app/api/v1/auth.py` | **Implemented** | Initiates Google OAuth consent with CSRF state cookies, validates authorization callbacks, exchanges tokens, verifies ID tokens, establishes HTTP-only server sessions, registers/authenticates local users, validates `/me`, and revokes sessions on `/logout`. |
| **REST Token Auth API** | `backend/app/api/routes/auth.py` | **Implemented** | Provides standard JWT bearer endpoints for mobile clients (`/register`, `/login`, `/me`, `/logout`, `/google`, `/phone/send-otp`, `/phone/verify-otp`). |
| **Password & Token Security Engine** | `backend/app/core/security.py` | **Implemented** | Argon2id password hashing, constant-time verification, cryptographic token generation (`secrets.token_urlsafe`), SHA-256 token hashing, signed session cookie payloads. |
| **Google Auth Service** | `backend/app/services/google_auth.py` | **Implemented** | Server-side Google OAuth 2.0 exchange, ID token verification via `google.oauth2.id_token`, audience and issuer checking. |
| **Phone OTP Provider** | `backend/app/services/auth_providers.py` | **Implemented (Dev Fallback)** | 6-digit cryptographic numeric passcode generator with 5-minute expiry, cooldown limits, and server-side development console logging when external SMS gateway is detached. |
| **Database Models** | `backend/app/models/` | **Implemented** | `User` (identity), `UserCredential` (Argon2id hash), `UserSession` (stateful session tokens, client IP, user agent, expiration, revocation), `UserIdentity` (OAuth bindings). |
| **Database Migrations** | `database/migrations/versions/` | **Implemented** | Alembic version migrations 001 through 005 tracking user tables, credentials, and session stores. |

---

## 3. Inventory: Existing Frontend Components

| Component | File Path | Status | Purpose |
| :--- | :--- | :--- | :--- |
| **Auth Context Provider** | `frontend/src/context/AuthContext.tsx` | **Implemented** | Hydrates user state on mount via `/api/v1/auth/me`, handles `useAuth()`, coordinates logout. |
| **Auth Service Client** | `frontend/src/services/authService.ts` | **Implemented** | Connects to `/api/v1/auth/login`, `/signup`, `/phone/send-otp`, `/phone/verify-otp`, Google token exchange, and `/logout`. |
| **Favorites / Bookmarks Service**| `frontend/src/services/favoriteService.ts` | **Implemented** | Transparently merges guest bookmarks (`localStorage`) into PostgreSQL user favorites (`/api/v1/favorites`) upon login. |
| **User Navigation Menu** | `frontend/src/components/explore/ExploreUserMenu.tsx` | **Implemented** | Renders user monogram avatar, role, and dropdown menu with profile and logout options. |

---

## 4. Environment Variables Analysis

### 4.1 Variables Identified in Configuration Files (Names Only)
- `DATABASE_URL`: PostgreSQL connection string (Neon serverless cloud or local Docker container).
- `PROJECT_NAME`: Service display identifier (`CampusWay`).
- `API_V1_STR`: API route prefix (`/api/v1`).
- `CORS_ORIGINS`: Allowed origins list for cross-origin requests.
- `ADMIN_API_KEY`: Administrative key for bulk GIS staging and moderation.
- `JWT_SECRET_KEY`: Cryptographic signing secret for JWT access tokens.
- `NEXT_PUBLIC_API_URL`: Browser-accessible API gateway URL.
- `NEXT_PUBLIC_APP_NAME`: Frontend application branding title.

### 4.2 Variables Required for Production Third-Party Providers
1. **Google OAuth 2.0:**
   - `GOOGLE_CLIENT_ID`: Public OAuth client ID from Google Cloud Console.
   - `GOOGLE_CLIENT_SECRET`: Confidential client secret for authorization code exchange.
   - `GOOGLE_REDIRECT_URI`: Registered callback endpoint (e.g. `http://localhost:3000/auth/google/callback`).
2. **SMS / Phone OTP:**
   - Production provider keys (e.g. `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`).
   - *Current Implementation:* Operates via the verified development fallback (`phone_otp_provider.py`) which logs the one-time code directly to the server log when `ENVIRONMENT=development`.
3. **Transactional Email (Verification & Password Reset):**
   - Production SMTP or API variables (e.g. `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` or `RESEND_API_KEY`).
   - *Current Implementation:* Operates with development token logging for local evaluation.

---

## 5. Security & Architectural Compliance Checklist

- [x] Passwords stored exclusively as memory-hard **Argon2id** hashes with constant-time verification.
- [x] Zero plain-text credentials in logs, database tables, or client payloads.
- [x] Dual-token / session architecture: short-lived credentials backed by server-side revocation tracking in `user_sessions`.
- [x] HTTP-only, SameSite=Lax, Secure session cookies preventing XSS token exfiltration.
- [x] Automatic guest-to-user bookmark migration preserving local bookmarks upon login.
- [x] Unauthenticated wayfinding remains 100% functional without forcing account creation.

