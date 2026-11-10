# CampusWay — Phase 0.1: Full-Stack Integration & Contract Audit

**Scope:** End-to-end integration tracing across Frontend, Backend, and Database  
**Audit Date:** November 10, 2026  
**Auditor:** Antigravity AI  
**Status:** Source-Code Level Verification (Inspection-Only)  

---

## 1. Architectural Integration Comparison

The CampusWay system is designed as a decoupled Next.js web application consuming a FastAPI REST service backed by PostgreSQL:

```
[ Next.js Client (Port 3000) ]
        │
        │ HTTP / JSON (via fetchWithTimeout)
        ▼
[ FastAPI Route Intelligence (Port 8000) ]
        │
        │ SQLAlchemy ORM (Sync Session / Engine)
        ▼
[ PostgreSQL / Neon Database (Port 5432) ]
```

While both subsystems have achieved high individual feature density, **they were developed against slightly diverging interface assumptions**. Below is the exhaustive source-level contract audit.

---

## 2. Key Contract Discrepancies & Gaps

### 2.1 Discrepancy 1: Environment Variable Naming
- **Frontend Config ([`frontend/.env.example`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/.env.example)) & Docker Compose:**
  ```bash
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```
- **Frontend Code ([`frontend/src/services/authService.ts#L17`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/authService.ts#L17)):**
  ```typescript
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  ```
- **Finding:** A developer populating `.env` from `.env.example` will find `authService.ts` ignoring `NEXT_PUBLIC_API_URL` and falling back to default `http://localhost:8000`.

---

### 2.2 Discrepancy 2: Authentication Token vs. Cookie Paradigm
- **Backend Implementation ([`backend/app/api/routes/auth.py#L33-L38`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/api/routes/auth.py#L33-L38)):**
  The active authentication endpoints (`POST /api/v1/auth/login`, `POST /api/v1/auth/register`) return a stateless JSON Web Token payload:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "expires_in_seconds": 86400,
    "user": { "id": "...", "email": "...", "role": "student" }
  }
  ```
- **Frontend Assumption ([`frontend/src/services/authService.ts#L54`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/authService.ts#L54)):**
  The frontend submits requests with `credentials: "include"`, stores **zero tokens** in browser storage, and expects subsequent requests (such as `GET /api/v1/auth/me`) to automatically authenticate via an HTTP-only session cookie (`campusway_session`).
- **Consequence:** When a user logs in, the backend sends the JWT in the JSON body, but sets no cookie. When `AuthContext` subsequently calls `GET /api/v1/auth/me`, the backend inspects the `Authorization: Bearer <token>` header, finds nothing, and returns HTTP 401 Unauthorized. The user is bounced back to `/login?error=session_required`.

---

### 2.3 Discrepancy 3: Phone OTP Route Paths
- **Frontend Calls ([`frontend/src/services/authService.ts#L140`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/authService.ts#L140)):**
  - Dispatch: `POST /api/v1/auth/otp/send`
  - Verify: `POST /api/v1/auth/otp/verify`
- **Backend Endpoints ([`backend/app/api/routes/auth.py#L98-L111`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/api/routes/auth.py#L98-L111)):**
  - Dispatch: `POST /api/v1/auth/phone/send-otp`
  - Verify: `POST /api/v1/auth/phone/verify-otp`
- **Consequence:** Submitting a mobile number for OTP verification immediately fails with HTTP 404 Not Found.

---

### 2.4 Discrepancy 4: Google OAuth Flow
- **Frontend Calls ([`frontend/src/services/authService.ts#L256`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/authService.ts#L256)):**
  Redirects browser to `GET /api/v1/auth/google/login`.
- **Backend Reality:**
  - The router that defines `GET /google/login` is `backend/app/api/v1/auth.py`.
  - Because `google-auth` is missing in `backend/venv`, this router failed to import and was never mounted.
  - The only registered Google endpoint is `POST /api/v1/auth/google` (which accepts a pre-fetched `{ id_token: string }`).
- **Consequence:** Clicking "Continue with Google" redirects to an endpoint that returns HTTP 404 Not Found.

---

### 2.5 Discrepancy 5: Routing Entity Contract (Locations vs. Navigation Nodes)
- **Frontend Expectation ([`frontend/src/services/routeService.ts#L16`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/routeService.ts#L16)):**
  The UI thinks in terms of Location IDs:
  ```typescript
  calculateRoute(fromId: string = "loc-main-gate", toId: string): Promise<CampusRoute>
  ```
- **Backend Expectation ([`backend/app/schemas/graph.py#L74-L79`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/schemas/graph.py#L74-L79)):**
  The backend routing algorithm operates strictly on topological Navigation Node UUIDs:
  ```python
  class RouteQuery(BaseModel):
      origin_node_id: uuid.UUID
      destination_node_id: uuid.UUID
      accessible_only: bool = False
      algorithm: str = "dijkstra"
  ```
- **Bridging Solution Already in Backend:**
  Backend endpoint `GET /api/v1/assistance/destinations` returns `List[VisitorDestinationCard]`, where each card contains `id` (Location UUID) AND `nearest_node_id` (Navigation Node UUID)! The frontend simply needs to resolve a Location ID to its `nearest_node_id` before invoking the routing calculation.

---

## 3. End-to-End User Journey Tracing (All 12 Journeys)

Below is the step-by-step trace through all 12 core journeys mandated by the audit:

---

### Journey 1: Visitor Opens the Application
1. **Frontend:** User navigates to `http://localhost:3000/`. Next.js renders `src/app/page.tsx` server component with hero image, navigation bar, and feature teasers.
2. **Backend / Database:** Zero network requests are made.
3. **Outcome:** **SUCCESS (Genuinely Functional).** Page renders smoothly without errors.

---

### Journey 2: User Registers an Account
1. **Frontend:** User navigates to `/signup`, enters Full Name, Email, and Password, and clicks "Create Account".
2. **Network:** `POST http://localhost:8000/api/v1/auth/register` with JSON `{ full_name, email, password }`.
3. **Backend:** Handled by `api.routes.auth.register`. Hashes password with PBKDF2-HMAC-SHA256, inserts a row into `users` and a linked row into `user_identities(provider='password')`. Generates HS256 JWT. Returns HTTP 201 Created with `{ access_token, user }`.
4. **Outcome:** **PARTIAL SUCCESS / BREAKS ON SESSION PERSISTENCE.** The database record is created. However, the frontend does not save the returned `access_token` into `localStorage` or headers, expecting a cookie. The user cannot stay logged in.

---

### Journey 3: User Logs In
1. **Frontend:** User navigates to `/login`, fills Email and Password, and clicks "Sign In".
2. **Network:** `POST http://localhost:8000/api/v1/auth/login` with `{ email, password, remember_me }`.
3. **Backend:** Queries `users` and `user_identities`, verifies password hash via `hmac.compare_digest`. Returns HTTP 200 with `{ access_token, user }`.
4. **Outcome:** **PARTIAL SUCCESS / BREAKS ON SESSION PERSISTENCE.** User credentials verify against database, but lack of token persistence leaves client unauthenticated on next request.

---

### Journey 4: Authenticated User Opens Explore Dashboard
1. **Frontend:** User visits `/explore`. `ExploreDashboardPage` runs `useEffect`:
   ```typescript
   if (!authLoading && !user) {
     router.push("/login?error=session_required");
   }
   ```
2. **Network:** `AuthContext` makes a background call to `GET /api/v1/auth/me` with `credentials: "include"`.
3. **Backend:** Rejects request with HTTP 401 Unauthorized because no `Authorization: Bearer <token>` header was attached.
4. **Outcome:** **BLOCKED / REDIRECT LOOP.** User is kicked back to `/login?error=session_required`. If the auth check is temporarily bypassed for demonstration, the explore UI renders completely using local mock data.

---

### Journey 5: User Searches for a Destination
1. **Frontend:** Inside `/explore`, user types "Block 34" or "Robotics" into the top search bar or DestinationPanel input.
2. **Network:** **Zero backend requests.**
3. **Local Behavior:** Filtered entirely in browser memory using JavaScript `.filter()` over the 18 items in `SAMPLE_LOCATIONS` (`campusData.ts`).
4. **Outcome:** **MOCKED.** Highly responsive and visually convincing, but completely disconnected from backend `GET /api/v1/locations/?search=...`.

---

### Journey 6: User Selects Origin and Destination
1. **Frontend:** User clicks "Block 34" card on the DestinationPanel or clicks the building shape on the SVG canvas.
2. **Local Behavior:** Sets `selectedLocation` state. Destination details, operating hours, and accessibility information populate in the right panel. Origin defaults to `"loc-main-gate"`.
3. **Outcome:** **MOCKED.** Seamless in UI, but operates purely on synthetic JavaScript objects.

---

### Journey 7: Frontend Requests a Route
1. **Frontend:** Selecting a destination automatically invokes `routeService.calculateRoute("loc-main-gate", selectedLocation.id)`.
2. **Service Behavior ([`frontend/src/services/routeService.ts`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/frontend/src/services/routeService.ts)):**
   ```typescript
   await new Promise((resolve) => setTimeout(resolve, 150));
   return generateDemonstrationRoute(fromId, toId);
   ```
3. **Network:** **No HTTP request is dispatched to the backend.**
4. **Outcome:** **MOCKED.** Never contacts `POST /api/v1/routing/calculate`.

---

### Journey 8: Backend Calculates the Route
1. **Backend Implementation ([`backend/app/api/routes/routing.py#L18`](file:///c:/Users/KK/Desktop/Projects/Campus%20Navigation/backend/app/api/routes/routing.py#L18)):**
   - Receives `POST /api/v1/routing/calculate` with `{ origin_node_id, destination_node_id, accessible_only, algorithm }`.
   - Invokes `compute_shortest_route(db, ...)` in `graph_service.py`.
   - Loads all active nodes and edges from database into in-memory `CampusGraph`.
   - Executes Dijkstra or A* search with predecessor backtracking.
   - Enriches path with turn instructions, distances, and walking duration.
2. **Current Reality:** The algorithm code is 100% verified by 6 unit tests in `test_routing.py`. **However, in the live database, 0 nodes and 0 edges exist.** Calling this endpoint against the unseeded database returns HTTP 404.
3. **Outcome:** **FUNCTIONAL CODE / BLOCKED BY EMPTY DATABASE & FRONTEND DISCONNECTION.**

---

### Journey 9: Frontend Renders the Returned Route
1. **Frontend:** When `activeRoute` state is updated, `CampusMap.tsx` computes SVG path string `routePathD` from `activeRoute.waypoints` (`M x y L x y`).
2. **Visual Behavior:** Renders an animated glowing path on top of the campus canvas and displays the Floating Route Preview banner (`~X min`, `X m`, `Step-free`).
3. **Outcome:** **MOCKED.** The SVG animation and visual display work beautifully, but render hardcoded demo waypoints from `campusData.ts`.

---

### Journey 10: User Saves a Destination
1. **Frontend:** User clicks the bookmark icon on the DestinationPanel.
2. **Local Behavior:** Toggles location ID in `savedLocationIds` React state. Displays a 3-second toast: *"Added 'Block 34' to Saved (Session demo)"*. Switching to the "Saved" tab displays the bookmarked card.
3. **Network:** **Zero requests made to backend `POST /api/v1/favorites/` or `GET /api/v1/favorites/mine`.**
4. **Outcome:** **MOCKED.** Bookmarks disappear as soon as the user refreshes the page.

---

### Journey 11: User Submits a Visitor Assistance Request
1. **Frontend:** User navigates to the "Help" tab in Sidebar, types an inquiry or assistance message, and clicks "Submit Request".
2. **Local Behavior:** Sets `ticketSent = true` for 4 seconds, showing a green checkmark confirmation banner, then resets.
3. **Network:** **Zero requests made to backend `POST /api/v1/assistance/requests`.**
4. **Outcome:** **MOCKED.** Ticket data is discarded immediately.

---

### Journey 12: User Logs Out
1. **Frontend:** User clicks "Sign Out" in Topbar dropdown.
2. **Network:** Calls `authService.logout()`, issuing `POST /api/v1/auth/logout`.
3. **Backend:** Returns HTTP 200 with `{ message: "Successfully logged out.", detail: "Client session ended." }`.
4. **Frontend:** Clears local `user` state and redirects browser to `/login?notice=logged_out`.
5. **Outcome:** **SUCCESS (Functional).**

---

## 4. Integration Summary Scorecard

| User Journey | Genuine Backend Connection | Mock Implementation | Current Status |
| :--- | :---: | :---: | :--- |
| 1. Open Landing Page | N/A (Static) | None | **Fully Functional** |
| 2. User Registration | Connected to DB | None | **Partial (Token unpersisted)** |
| 3. User Login | Connected to DB | None | **Partial (Token unpersisted)** |
| 4. Open Explore | Blocked by 401 | Mock Data fallback | **Blocked / Mocked** |
| 5. Destination Search | Disconnected | In-Memory JS Filter | **Mocked** |
| 6. Select Destination | Disconnected | In-Memory Object | **Mocked** |
| 7. Request Route | Disconnected | Simulated delay | **Mocked** |
| 8. Route Calculation | Algorithm Ready | None (Unseeded DB) | **Functional in Backend / Disconnected** |
| 9. Render Route on Map | Disconnected | SVG Vector Path | **Mocked** |
| 10. Bookmark Location | Disconnected | Local React `useState` | **Mocked** |
| 11. Visitor Assistance | Disconnected | Local Timer State | **Mocked** |
| 12. User Logout | Connected | None | **Fully Functional** |

