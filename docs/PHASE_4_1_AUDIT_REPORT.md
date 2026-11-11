# CampusWay — Phase 4.1: Authentication & Visitor Experience Audit Report

**Branch:** `demo/submission-mvp`  
**Working-Tree Status:** In sync with `origin/demo/submission-mvp`, working tree clean.  
**Audit Target:** Local PostgreSQL container (`localhost:5434/campusway_db`) and running FastAPI backend (`127.0.0.1:8000`). Neon cloud database was not connected or modified.  
**Audit Date:** November 2026  
**Status:** COMPLETE (Inspection-Only Audit — Zero Functional Code Modified)

---

## 1. Executive Summary

A comprehensive source-code and empirical API audit was conducted on CampusWay's authentication, user profile, saved destinations (favorites), and visitor assistance systems.

### Key Audit Findings:
1. **Authentication Architecture:**
   - The active, functional, and database-backed authentication system is **`backend/app/api/routes/auth.py`** (mounted at `/api/v1/auth`), which uses `Session = Depends(get_db)` and persists users and PBKDF2 password hashes into PostgreSQL `users` and `user_identities` tables.
   - A parallel/legacy router **`backend/app/api/v1/auth.py`** attempts to import `google-auth` (which is not installed in `backend/venv`), causing a `ModuleNotFoundError` that is silently swallowed in `main.py` via `try...except Exception: pass`. Consequently, cookie-session routes (`/auth/*`) are not mounted.
   - Frontend `authService.ts` correctly calls `/api/v1/auth/register` and `/api/v1/auth/login`, and transmits JWT Bearer tokens to `/api/v1/auth/me`.
   - Phone OTP and Google login URLs in `authService.ts` have endpoint path mismatches (`/api/v1/auth/otp/send` vs backend `/api/v1/auth/phone/send-otp`).
2. **User Profile:**
   - Profile data (`email`, `full_name`, `role`, `email_verified`) is loaded from `/api/v1/auth/me` and rendered in the `Topbar.tsx` dropdown.
   - There is **no dedicated profile page** (`/profile`) and **no profile edit endpoint** (`PATCH /api/v1/users/me`) in the active API router. Profile editing is currently **Missing**.
3. **Saved Destinations (Favorites):**
   - **Backend:** A complete SQLAlchemy model (`Favorite`), database table (`favorites`), service (`favorite_service.py`), and API endpoints (`GET /api/v1/favorites/mine`, `POST /api/v1/favorites/`, `DELETE /api/v1/favorites/{user_id}/{location_id}`) are **Fully Implemented** in PostgreSQL.
   - **Frontend:** Currently operates exclusively via temporary React `useState<string[]>` in [`explore/page.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/app/explore/page.tsx) without calling the backend favorites endpoints. Bookmarks do not persist across page reloads. Frontend implementation is **UI only / mock**.
4. **Visitor Assistance:**
   - **Backend:** A complete database table (`assistance_requests`), model (`AssistanceRequest`), and endpoints (`POST /api/v1/assistance/requests`, `GET /requests`, `PATCH /requests/{id}`) exist and support both guest and authenticated user inquiries.
   - **Frontend:** [`HelpTab.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/dashboard/HelpTab.tsx) has static FAQs and emergency contacts, and a textarea form that merely triggers a 4-second local timer without making any API request. Frontend implementation is **UI only / mock**.

---

## 2. Feature Classification Matrices

### 2.1 Authentication Feature Matrix
| Feature | Backend Status | Frontend Status | Overall Classification | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Email/Password Registration** | `POST /api/v1/auth/register` persists `User` & `UserIdentity` (PBKDF2) | `SignupForm.tsx` calls `authService.signup` | **Fully implemented and verified** | Tested: creates user and returns JWT |
| **Email/Password Login** | `POST /api/v1/auth/login` verifies hash, returns JWT | `LoginForm.tsx` calls `authService.login` | **Fully implemented and verified** | Tested: returns valid JWT access token |
| **JWT Session Verification** | `GET /api/v1/auth/me` decodes JWT `sub` and returns `UserRead` | `authService.getCurrentUser` passes Bearer token | **Fully implemented and verified** | Tested: HTTP 200 with token, HTTP 401 without |
| **Session Persistence** | Stateless JWT (60m validity) | `localStorage` token storage | **Fully implemented and verified** | Survives browser refresh |
| **Logout** | `POST /api/v1/auth/logout` returns success message | `authService.logout` clears `localStorage` token | **Fully implemented and verified** | Client discards Bearer token |
| **Public Guest Navigation** | Endpoints `/locations`, `/assistance/destinations`, `/routing/calculate` are public | `/explore` allows guest access as "Campus Explorer" | **Fully implemented and verified** | Guests can search and route freely |
| **Google OAuth (ID Token)** | `POST /api/v1/auth/google` (verifies via Google tokeninfo) | `GoogleButton.tsx` / `authService.ts` | **Partially implemented** | Backend endpoint functional (503 when unconfigured). Frontend redirects to unmounted `/api/v1/auth/google/login` |
| **Phone OTP (SMS)** | `POST /api/v1/auth/phone/send-otp` & `verify-otp` (Twilio) | `PhoneOtpForm.tsx` | **Partially implemented** | Backend endpoints functional (503 when unconfigured). Frontend calls mismatched paths (`/auth/otp/send`) |

### 2.2 User Profile Feature Matrix
| Feature | Backend Status | Frontend Status | Overall Classification | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Profile Display** | Sourced via `GET /api/v1/auth/me` | Topbar profile menu displays initials, name, email | **Fully implemented and verified** | Verified in Topbar dropdown |
| **Guest Profile Handling** | Null session allowed on public endpoints | Topbar displays "Campus Explorer" / "Visitor" | **Fully implemented and verified** | Graceful fallback when unauthenticated |
| **Dedicated Profile Page** | None | None (`/profile` route does not exist) | **Missing** | No standalone profile route |
| **Profile Editing (Name/Phone)** | None in active router (`api_router`) | None | **Missing** | No `PATCH /api/v1/users/me` endpoint |
| **Password Change** | None in active router | None | **Missing** | No credential update endpoint |

### 2.3 Saved Destinations (Favorites) Feature Matrix
| Feature | Backend Status | Frontend Status | Overall Classification | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Favorites Model & DB Table** | `Favorite` model & `favorites` table in PostgreSQL | None | **Implemented but not verified on FE** | Table has composite PK `(user_id, location_id)` |
| **Add Favorite Endpoint** | `POST /api/v1/favorites/` | None (calls React state `setSavedIds`) | **Partially implemented** | Backend endpoint verified; Frontend not connected |
| **List My Favorites Endpoint** | `GET /api/v1/favorites/mine` | None (reads `savedIds` state) | **Partially implemented** | Backend endpoint verified; Frontend not connected |
| **Remove Favorite Endpoint** | `DELETE /api/v1/favorites/{user_id}/{location_id}` | None (filters `savedIds` state) | **Partially implemented** | Backend endpoint verified; Frontend not connected |
| **Cross-Session Persistence** | Database persistence verified via SQL | None (resets on page reload) | **UI only / mock** | Frontend state resets on refresh |
| **Guest Favorites** | Requires authenticated user UUID | Stores in React state | **Partially implemented** | Guest favorites need `localStorage` fallback |

### 2.4 Visitor Assistance Feature Matrix
| Feature | Backend Status | Frontend Status | Overall Classification | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Destination Cards API** | `GET /api/v1/assistance/destinations` | Connected in `locationService.ts` | **Fully implemented and verified** | Powers the Explore tab (48 buildings) |
| **Submit Assistance Request** | `POST /api/v1/assistance/requests` | Textarea form with synthetic timer | **Partially implemented** | Backend endpoint verified; Frontend form is mock |
| **Assistance Request Persistence** | `assistance_requests` table in PostgreSQL | None | **Implemented but not verified on FE** | Verified via SQL inspection |
| **Guest Request Submission** | `user_id` is nullable in DB | Mock only | **Partially implemented** | Backend allows unauthenticated help requests |
| **Staff Triage / Listing** | `GET /api/v1/assistance/requests` (Moderator/Admin) | None | **Implemented but not verified on FE** | Backend RBAC enforced; no staff UI |
| **Emergency Contacts & FAQs** | None (static presentation) | Hardcoded in `HelpTab.tsx` | **UI only / mock** | Suitable for static MVP presentation |

---

## 3. Inventory of Relevant Files

### 3.1 Backend Source Files
- [`backend/app/api/routes/auth.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/api/routes/auth.py) — Active authentication router (register, login, me, logout, google, phone OTP).
- [`backend/app/api/v1/auth.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/api/v1/auth.py) — Legacy cookie-session auth router (unmounted due to missing `google-auth` dependency).
- [`backend/app/services/auth_service.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/services/auth_service.py) — Core identity lifecycle logic with PostgreSQL persistence.
- [`backend/app/services/auth_providers.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/services/auth_providers.py) — Google ID token verification (httpx) and Twilio Verify providers.
- [`backend/app/services/favorite_service.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/services/favorite_service.py) — User favorites CRUD operations.
- [`backend/app/services/assistance_service.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/services/assistance_service.py) — Visitor destinations and assistance request management.
- [`backend/app/models/user.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/models/user.py) — `User` and `UserIdentity` models.
- [`backend/app/models/favorite.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/models/favorite.py) — `Favorite` composite model.
- [`backend/app/models/assistance.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/models/assistance.py) — `AssistanceRequest` model.
- [`backend/app/api/routes/favorites.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/api/routes/favorites.py) — Favorites API endpoints.
- [`backend/app/api/routes/assistance.py`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/api/routes/assistance.py) — Assistance and destination API endpoints.

### 3.2 Frontend Source Files
- [`frontend/src/services/authService.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/authService.ts) — Authentication client service.
- [`frontend/src/context/AuthContext.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/context/AuthContext.tsx) — React authentication context and session state provider.
- [`frontend/src/app/login/page.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/app/login/page.tsx) & [`frontend/src/components/auth/LoginForm.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/auth/LoginForm.tsx) — User sign-in interface.
- [`frontend/src/app/signup/page.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/app/signup/page.tsx) & [`frontend/src/components/auth/SignupForm.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/auth/SignupForm.tsx) — User registration interface.
- [`frontend/src/components/dashboard/Topbar.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/dashboard/Topbar.tsx) — Profile dropdown and session status display.
- [`frontend/src/components/dashboard/SavedTab.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/dashboard/SavedTab.tsx) — Bookmarked destinations tab.
- [`frontend/src/components/dashboard/HelpTab.tsx`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/components/dashboard/HelpTab.tsx) — Help, FAQs, and assistance request tab.
- [`frontend/src/types/auth.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/types/auth.ts) — Frontend authentication and user profile models.

---

## 4. API Endpoints & Response Contracts

### 4.1 Authentication Endpoints (`/api/v1/auth`)
| Method | Endpoint | Request Payload | Response Contract (Success) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `RegisterRequest`: `{ email, password, full_name, phone?, role? }` | `TokenResponse`: `{ access_token, token_type: "bearer", expires_in_seconds, user: UserRead }` |
| `POST` | `/api/v1/auth/login` | `LoginRequest`: `{ email, password }` | `TokenResponse`: `{ access_token, token_type: "bearer", expires_in_seconds, user: UserRead }` |
| `GET` | `/api/v1/auth/me` | None (requires `Authorization: Bearer <token>`) | `UserRead`: `{ id, email, full_name, phone, role, is_active, created_at, updated_at }` |
| `POST` | `/api/v1/auth/logout` | None (requires `Authorization: Bearer <token>`) | `MessageResponse`: `{ message: "Successfully logged out.", detail: "..." }` |
| `POST` | `/api/v1/auth/google` | `GoogleLoginRequest`: `{ id_token }` | `TokenResponse` (or HTTP 503 if provider unconfigured) |
| `POST` | `/api/v1/auth/phone/send-otp` | `PhoneSendOTPRequest`: `{ phone }` | `MessageResponse` (or HTTP 503 if provider unconfigured) |
| `POST` | `/api/v1/auth/phone/verify-otp` | `PhoneVerifyOTPRequest`: `{ phone, otp_code, full_name? }` | `TokenResponse` (or HTTP 400 if invalid) |

### 4.2 Favorites Endpoints (`/api/v1/favorites`)
| Method | Endpoint | Request Payload | Response Contract |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/favorites/mine` | None (requires `Authorization: Bearer <token>`) | `List[FavoriteRead]`: `[{ user_id, location_id, created_at }]` |
| `POST` | `/api/v1/favorites/` | `FavoriteCreate`: `{ user_id, location_id }` | `FavoriteRead`: `{ user_id, location_id, created_at }` |
| `DELETE` | `/api/v1/favorites/{user_id}/{location_id}` | Path parameters | HTTP 204 No Content |

### 4.3 Assistance Endpoints (`/api/v1/assistance`)
| Method | Endpoint | Request Payload | Response Contract |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/assistance/requests` | `AssistanceRequestCreate`: `{ requester_name?, contact_phone?, target_location_id?, assistance_type, description? }` | `AssistanceRequestRead`: `{ id, requester_name, contact_phone, user_id, target_location_id, assistance_type, description, status, created_at }` |
| `GET` | `/api/v1/assistance/destinations` | Query params: `query?`, `category?`, `limit?` | `List[VisitorDestinationCard]` |
| `GET` | `/api/v1/assistance/requests` | Query params: `status?`, `skip?`, `limit?` (Staff only) | `List[AssistanceRequestRead]` |
| `PATCH` | `/api/v1/assistance/requests/{id}` | `AssistanceRequestUpdate`: `{ status?, assigned_to?, resolution_notes? }` | `AssistanceRequestRead` |

---

## 5. Database Persistence Findings

An inspection of PostgreSQL on port 5434 confirmed all relevant schemas and relationships:

1. **`users` Table:**
   - Columns: `id` (UUID PK), `full_name` (VARCHAR 120), `email` (VARCHAR 255 UNIQUE), `phone` (VARCHAR 20 UNIQUE), `role` (VARCHAR 20), `is_active` (BOOLEAN), `created_at`, `updated_at`.
2. **`user_identities` Table:**
   - Columns: `id` (UUID PK), `user_id` (UUID FK $\rightarrow$ users.id CASCADE), `provider` (VARCHAR 40), `provider_subject` (TEXT), `created_at`.
   - Stores PBKDF2 password hashes when `provider = 'password'`.
3. **`favorites` Table:**
   - Columns: `user_id` (UUID FK $\rightarrow$ users.id CASCADE), `location_id` (UUID FK $\rightarrow$ locations.id CASCADE), `created_at`.
   - Composite Primary Key: `(user_id, location_id)`.
4. **`assistance_requests` Table:**
   - Columns: `id` (UUID PK), `requester_name` (VARCHAR 120), `contact_phone` (VARCHAR 20), `user_id` (UUID FK $\rightarrow$ users.id SET NULL), `current_location_id`, `current_node_id`, `target_location_id`, `assistance_type` (VARCHAR 40), `description` (TEXT), `status` (VARCHAR 20 with check constraint), `assigned_to`, `resolution_notes`, `created_at`, `resolved_at`.

---

## 6. Security Analysis & Vulnerability Review

1. **Silent Exception in `main.py`:**
   - Lines 33–38 in `backend/app/main.py`:
     ```python
     try:
         from app.api.v1.auth import router as auth_session_router
         app.include_router(auth_session_router, prefix="")
     except Exception:
         pass
     ```
   - This `pass` masked a `ModuleNotFoundError: No module named 'google'`. In production, silent exception swallowing should be replaced with explicit logging or removal of dead/unmaintained routers.
2. **Authorization & IDOR Protection:**
   - Verified that `backend/app/api/routes/favorites.py` verifies `current_user_id` from the JWT token against `favorite_in.user_id`. An authenticated user cannot create or delete favorites for another user.
3. **Password Security:**
   - Password hashes are stored with PBKDF2-SHA256 (100,000 iterations) in `user_identities`. Plaintext passwords are never persisted.
4. **Token Security:**
   - JWT tokens use HMAC-SHA256 with 60-minute expiry. Tampered signatures return HTTP 401.
5. **Rate Limiting:**
   - The backend currently lacks rate-limiting middleware on `/api/v1/auth/login`, `/register`, and `/phone/send-otp`. Recommended for production hardening.

---

## 7. Actual Tests Executed & Empirical Results

The test suite (`scratch/audit_phase4_1.py`) was executed against the live local database (port 5434) and FastAPI backend (port 8000):

| Test Case | Method & Endpoint | Payload | Expected | Actual Result |
| :--- | :--- | :--- | :--- | :--- |
| **T1: User Registration** | `POST /api/v1/auth/register` | Valid email, password, full_name | HTTP 201 + TokenResponse | **PASS (HTTP 201)** — User persisted in DB |
| **T2: User Login** | `POST /api/v1/auth/login` | Valid credentials | HTTP 200 + Bearer token | **PASS (HTTP 200)** — Valid JWT returned |
| **T3: Session Profile (Auth)** | `GET /api/v1/auth/me` | Bearer token in header | HTTP 200 + UserRead | **PASS (HTTP 200)** — Matches user email |
| **T4: Session Profile (Anon)** | `GET /api/v1/auth/me` | No token | HTTP 401 Unauthorized | **PASS (HTTP 401)** — Rejected anonymously |
| **T5: Add Favorite** | `POST /api/v1/favorites/` | user_id, location_id (Library) | HTTP 201 + FavoriteRead | **PASS (HTTP 201)** — Row created in `favorites` |
| **T6: List Favorites** | `GET /api/v1/favorites/mine` | Bearer token | HTTP 200 + List of 1 item | **PASS (HTTP 200)** — Returned bookmarked item |
| **T7: Delete Favorite** | `DELETE /api/v1/favorites/{u}/{l}` | Path params | HTTP 204 No Content | **PASS (HTTP 204)** — Row deleted from `favorites` |
| **T8: Guest Help Request** | `POST /api/v1/assistance/requests` | No auth, phone + description | HTTP 201 + RequestRead | **PASS (HTTP 201)** — Persisted with `user_id = null` |
| **T9: User Help Request** | `POST /api/v1/assistance/requests` | Bearer token, mobility inquiry | HTTP 201 + RequestRead | **PASS (HTTP 201)** — Linked to user UUID |
| **T10: Unconfigured Google** | `POST /api/v1/auth/google` | ID token | HTTP 503 Unavailable | **PASS (HTTP 503)** — Clean provider notice |
| **T11: Unconfigured Phone OTP** | `POST /api/v1/auth/phone/send-otp` | Phone number | HTTP 503 Unavailable | **PASS (HTTP 503)** — Clean provider notice |

---

## 8. Prioritized Implementation Plan (Phase 4.2+)

Based on the audit findings, the recommended implementation plan for subsequent phases is:

1. **Phase 4.2 — Favorites Backend Integration:**
   - Create `frontend/src/services/favoriteService.ts` to call `/api/v1/favorites/mine`, `POST /api/v1/favorites/`, and `DELETE /api/v1/favorites/{user_id}/{location_id}`.
   - For authenticated users: persist bookmarks directly to PostgreSQL.
   - For guest users: gracefully fallback to `localStorage` bookmarks with an upgrade prompt upon login.
2. **Phase 4.3 — Visitor Assistance (Help Tab) Integration:**
   - Connect the request form in `HelpTab.tsx` to `POST /api/v1/assistance/requests`.
   - Provide input fields for `requester_name`, `contact_phone`, and `assistance_type` (General Inquiry, Lost / Navigation Guidance, Accessibility / Mobility Support).
   - Display the returned ticket ID and live status banner.
3. **Phase 4.4 — Auth URL Reconciliation & Provider Hardening:**
   - Fix Phone OTP endpoints in `authService.ts` to match `/api/v1/auth/phone/send-otp` and `/phone/verify-otp`.
   - Clean up the unmounted legacy router `app.api.v1.auth` and remove the silent `try...except` in `main.py`.
4. **Phase 4.5 — User Profile View & Account Settings (Post-MVP):**
   - Add a dedicated profile modal or `/profile` view for updating display name, phone, and role preferences.

