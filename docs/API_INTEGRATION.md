# CampusWay Frontend API Integration Contract
**Target Application**: Next.js Web Client, Mobile App, and Public Kiosks  
**Base API URL**: `/api/v1`  
**FastAPI Interactive Documentation**: `http://localhost:8000/api/v1/docs`  
**OpenAPI Specification**: `http://localhost:8000/api/v1/openapi.json`  

---

## 1. Architectural & Protocol Foundations

### 1.1 Base URLs
- **Local Development**: `http://localhost:8000/api/v1`
- **Docker Compose**: `http://localhost:8000/api/v1`
- **Health Check**: `GET http://localhost:8000/health` (Public, no auth)

### 1.2 Authentication Scheme & Headers
The API supports stateless JWT Bearer authorization and role-based permissions:

| Header Name | Format / Example | Required For |
| :--- | :--- | :--- |
| `Authorization` | `Bearer eyJhbGciOiJIUzI1NiIsIn...` | Authenticated user/staff operations |
| `X-Admin-Key` | `<admin_secret_key>` | Direct administrative / automation operations |
| `X-User-ID` | `c8df94b4-d538-4f81-8b20-13f8c5b967dc` | Development / test fallback |
| `Content-Type` | `application/json` | All `POST`, `PUT`, `PATCH` requests |

### 1.3 Role Hierarchy
1. **`visitor` / Anonymous**: Default public browsing (search locations, compute routes, request visitor assistance, resolve QR codes).
2. **`user`**: Registered campus user / student (manage favorites, view own profile, submit map reports, track own reports).
3. **`moderator`**: Campus staff / security desk (review visitor assistance requests, assign staff, update report statuses).
4. **`admin`**: Super-administrator (create/edit locations, manage routing graph vertices and edges, import external map data, approve/reject staged records).

### 1.4 Standard HTTP Status Codes & Error Format
All errors follow standard RFC 7807 / FastAPI JSON responses:

```json
{
  "detail": "Descriptive human-readable error explanation."
}
```

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `204 No Content`: Resource deleted successfully.
- `400 Bad Request`: Input validation failed, invalid enum, or cyclic hierarchy.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: User lacks necessary permissions or role.
- `404 Not Found`: Resource ID does not exist or has been removed.
- `422 Unprocessable Entity`: Pydantic payload schema mismatch.

---

## 2. Authentication API (`/api/v1/auth`)

### 2.1 Register User
- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Auth**: None (Public)
- **Request Body**:
```json
{
  "email": "student@lpu.in",
  "password": "SecurePassword123!",
  "full_name": "Aman Kumar",
  "phone": "+919876543210"
}
```
- **Response (201 Created)**:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in_seconds": 86400,
  "user": {
    "id": "7f240367-a2f0-4d56-a417-ea1d82136e09",
    "email": "student@lpu.in",
    "role": "user",
    "is_active": true,
    "created_at": "2026-11-01T20:00:00Z"
  }
}
```

### 2.2 Login User
- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Auth**: None (Public)
- **Request Body**:
```json
{
  "email": "student@lpu.in",
  "password": "SecurePassword123!"
}
```
- **Response (200 OK)**: Same as register response.

### 2.3 Get Current User Profile
- **Method**: `GET`
- **Endpoint**: `/auth/me`
- **Auth**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "id": "7f240367-a2f0-4d56-a417-ea1d82136e09",
  "email": "student@lpu.in",
  "role": "user",
  "is_active": true,
  "created_at": "2026-11-01T20:00:00Z",
  "identities": [
    {
      "id": "a90b6d91-1c31-419b-b461-1c23f79d9501",
      "provider": "email",
      "provider_user_id": "student@lpu.in",
      "created_at": "2026-11-01T20:00:00Z"
    }
  ]
}
```

### 2.4 Google OAuth Single Sign-On
- **Method**: `POST`
- **Endpoint**: `/auth/google`
- **Auth**: None (Public)
- **Request Body**:
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```
- **Response (200 OK)**: `TokenResponse`

### 2.5 Phone OTP Flow
- **Request OTP**: `POST /auth/phone/send-otp`  
  Body: `{"phone": "+919876543210"}` -> Response: `{"message": "Verification passcode dispatched...", "detail": "..."}`
- **Verify OTP**: `POST /auth/phone/verify-otp`  
  Body: `{"phone": "+919876543210", "otp_code": "123456"}` -> Response: `TokenResponse`

---

## 3. Location Management API (`/api/v1/locations`)

### 3.1 List / Search Locations
- **Method**: `GET`
- **Endpoint**: `/locations/`
- **Auth**: None (Public)
- **Query Parameters**:
  - `query` (string, optional): Search keyword matched against name, slug, and aliases (ranked with exact matches prioritized).
  - `location_type` (string, optional): `building`, `gate`, `room`, `landmark`, `facility`, `food_court`.
  - `is_verified` (bool, optional): `true` or `false`.
  - `is_active` (bool, default `true`): Inactive locations omitted by default.
  - `skip` (int, default `0`)
  - `limit` (int, default `50`, max `100`)
- **Example Request**:
  `GET /api/v1/locations/?query=block%2034&location_type=building`
- **Response (200 OK)**:
```json
[
  {
    "id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
    "name": "Block 34 (Engineering Block)",
    "slug": "block-34-engineering-block",
    "location_type": "building",
    "parent_id": null,
    "latitude": 31.2541,
    "longitude": 75.7032,
    "is_accessible": true,
    "is_verified": true,
    "is_active": true,
    "created_at": "2026-11-01T20:00:00Z",
    "updated_at": "2026-11-01T20:00:00Z"
  }
]
```

### 3.2 Get Location Details (with Sub-locations & Aliases)
- **Method**: `GET`
- **Endpoint**: `/locations/{location_id}`
- **Auth**: None (Public)
- **Response (200 OK)**:
```json
{
  "id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
  "name": "Block 34 (Engineering Block)",
  "slug": "block-34-engineering-block",
  "location_type": "building",
  "parent_id": null,
  "latitude": 31.2541,
  "longitude": 75.7032,
  "is_accessible": true,
  "is_verified": true,
  "is_active": true,
  "children": [
    {
      "id": "b11a5e12-881a-428a-8be7-51ff10626b9a",
      "name": "Room 34-101",
      "location_type": "room"
    }
  ],
  "aliases": [
    {
      "id": "c19b02a2-8991-4475-8ef6-c73dbca613bf",
      "alias": "B34",
      "normalized_alias": "b34"
    }
  ]
}
```

### 3.3 Location Hierarchy & Ancestors
- **Hierarchical Tree**: `GET /locations/{location_id}/hierarchy`  
  Returns `{ "location": LocationRead, "ancestors": LocationRead[], "children": LocationRead[] }`
- **Ancestor Chain**: `GET /locations/{location_id}/ancestors`  
  Returns ordered list `[Room -> Floor -> Building]`.
- **Direct Children**: `GET /locations/{location_id}/children?is_active=true`

### 3.4 Administrative Location Management
- **Create Location**: `POST /locations/` (Admin only)  
  *Note: Cannot arbitrarily set `is_verified=true` on creation; verification requires dedicated `/verify` endpoint.*
- **Update Location**: `PUT /locations/{location_id}` (Admin only, checks for hierarchy cycles)
- **Verify Location**: `POST /locations/{location_id}/verify` (Admin only)  
  Body: `{"is_verified": true}`
- **Soft Deactivate**: `DELETE /locations/{location_id}?cascade=false` (Admin only)
- **Add Alias**: `POST /locations/{location_id}/aliases` (Admin only)  
  Body: `{"alias": "CSE Dept"}`

---

## 4. Routing & Pathfinding API (`/api/v1/routing`)

### 4.1 Calculate Shortest Walking Route
- **Method**: `POST`
- **Endpoint**: `/routing/calculate`
- **Auth**: None (Public)
- **Request Body**:
```json
{
  "origin_node_id": "11111111-1111-1111-1111-111111111111",
  "destination_node_id": "22222222-2222-2222-2222-222222222222",
  "accessible_only": false,
  "algorithm": "dijkstra"
}
```
*Algorithms supported*: `"dijkstra"` (default) or `"astar"`.

- **Response (200 OK)**:
```json
{
  "origin_node_id": "11111111-1111-1111-1111-111111111111",
  "destination_node_id": "22222222-2222-2222-2222-222222222222",
  "total_distance_m": 125.4,
  "estimated_time_seconds": 96.5,
  "is_accessible": true,
  "nodes": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "location_id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
      "node_type": "entrance",
      "latitude": 31.25410,
      "longitude": 75.70320,
      "is_accessible": true,
      "is_active": true
    },
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "location_id": null,
      "node_type": "junction",
      "latitude": 31.25480,
      "longitude": 75.70390,
      "is_accessible": true,
      "is_active": true
    }
  ],
  "segments": [
    {
      "edge_id": "33333333-3333-3333-3333-333333333333",
      "source_node_id": "11111111-1111-1111-1111-111111111111",
      "target_node_id": "22222222-2222-2222-2222-222222222222",
      "distance_m": 125.4,
      "path_type": "footpath",
      "is_accessible": true,
      "instruction": "Continue along the footpath (approx. 125 m)"
    }
  ]
}
```

- **Error (404 Not Found)**:
```json
{
  "detail": "No walkable path found between the specified origin and destination nodes."
}
```

### 4.2 Query Routing Graph Vertices & Edges
- `GET /routing/nodes?location_id={uuid}&is_active=true` (Public)
- `GET /routing/edges?accessible_only=false&is_active=true` (Public)
- `POST /routing/nodes` (Admin only)
- `DELETE /routing/nodes/{node_id}` (Admin only)
- `POST /routing/edges` (Admin only)
- `DELETE /routing/edges/{edge_id}` (Admin only)

---

## 5. Visitor Assistance & Signpost QR API (`/api/v1/assistance`)

### 5.1 Submit Visitor Assistance Request
- **Method**: `POST`
- **Endpoint**: `/assistance/requests`
- **Auth**: Optional (Supports anonymous visitors or logged-in users)
- **Request Body**:
```json
{
  "visitor_name": "Rajesh Sharma",
  "contact_phone": "+919812345678",
  "current_location_desc": "Near Main Gate 1 security desk",
  "destination_desc": "Block 38 Admissions Office",
  "request_type": "directions"
}
```
*Valid `request_type` values*: `"directions"`, `"accessibility"`, `"lost_found"`, `"medical"`.

- **Response (201 Created)**:
```json
{
  "id": "e3025eb2-5882-4aa8-9f2d-8b0bb30f36f9",
  "visitor_name": "Rajesh Sharma",
  "contact_phone": "+919812345678",
  "current_location_desc": "Near Main Gate 1 security desk",
  "destination_desc": "Block 38 Admissions Office",
  "request_type": "directions",
  "status": "pending",
  "assigned_to": null,
  "resolution_notes": null,
  "created_at": "2026-11-01T20:15:00Z",
  "updated_at": "2026-11-01T20:15:00Z"
}
```

### 5.2 Browse Visitor Destination Cards
- **Method**: `GET`
- **Endpoint**: `/assistance/destinations`
- **Auth**: None (Public)
- **Query Parameters**: `query`, `category` (`gate`, `building`, `food_court`, `landmark`), `skip`, `limit`.
- **Response (200 OK)**:
```json
[
  {
    "id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
    "name": "Main Gate 1",
    "slug": "main-gate-1",
    "location_type": "gate",
    "latitude": 31.2510,
    "longitude": 75.7001,
    "has_routing_nodes": true,
    "associated_node_id": "11111111-1111-1111-1111-111111111111",
    "aliases": ["GT Road Entrance", "Gate 1"]
  }
]
```

### 5.3 Resolve Signpost QR Token
- **Method**: `GET`
- **Endpoint**: `/assistance/qr/{qr_token}`
- **Auth**: None (Public)
- **Response (200 OK)**:
```json
{
  "is_valid": true,
  "qr_type": "signpost",
  "location_id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
  "node_id": "11111111-1111-1111-1111-111111111111",
  "location_name": "Block 34 (Engineering Block)",
  "location_type": "building",
  "latitude": 31.2541,
  "longitude": 75.7032,
  "has_route_topology": true,
  "message": "Valid navigation signpost located at Block 34 (Engineering Block)."
}
```

---

## 6. User Favorites API (`/api/v1/favorites`)

All favorites endpoints require an authenticated user session (`Authorization: Bearer <token>`).

### 6.1 List Current User's Favorites
- **Method**: `GET`
- **Endpoint**: `/favorites/mine`
- **Response (200 OK)**:
```json
[
  {
    "user_id": "7f240367-a2f0-4d56-a417-ea1d82136e09",
    "location_id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
    "created_at": "2026-11-01T20:20:00Z",
    "location": {
      "id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
      "name": "Central Library",
      "slug": "central-library",
      "location_type": "building"
    }
  }
]
```

### 6.2 Bookmark a Location
- **Method**: `POST`
- **Endpoint**: `/favorites/`
- **Request Body**:
```json
{
  "user_id": "7f240367-a2f0-4d56-a417-ea1d82136e09",
  "location_id": "e851c911-3965-4a25-a134-c7fc4f2249e1"
}
```
- **Response (201 Created)**: `FavoriteRead`

### 6.3 Remove a Bookmarked Location
- **Method**: `DELETE`
- **Endpoint**: `/favorites/{user_id}/{location_id}`
- **Response**: `204 No Content`

---

## 7. Map Issues & Reporting API (`/api/v1/reports`)

### 7.1 Submit a Report
- **Method**: `POST`
- **Endpoint**: `/reports/`
- **Auth**: Optional (Can be anonymous or linked to authenticated reporter)
- **Request Body**:
```json
{
  "report_type": "inaccessible_path",
  "description": "Wheelchair ramp at Block 34 entrance is blocked by construction equipment.",
  "location_id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
  "node_id": "11111111-1111-1111-1111-111111111111",
  "edge_id": null
}
```
*Valid `report_type` values*: `"incorrect_info"`, `"inaccessible_path"`, `"blocked_path"`, `"missing_map_feature"`.

- **Response (201 Created)**:
```json
{
  "id": "d0496da1-2a1e-450a-9d96-9f44ef7db944",
  "reporter_id": "7f240367-a2f0-4d56-a417-ea1d82136e09",
  "location_id": "e851c911-3965-4a25-a134-c7fc4f2249e1",
  "node_id": "11111111-1111-1111-1111-111111111111",
  "edge_id": null,
  "report_type": "inaccessible_path",
  "status": "pending",
  "description": "Wheelchair ramp at Block 34 entrance is blocked by construction equipment.",
  "resolution_notes": null,
  "created_at": "2026-11-01T20:30:00Z",
  "updated_at": "2026-11-01T20:30:00Z"
}
```

### 7.2 List Own Reports
- **Method**: `GET`
- **Endpoint**: `/reports/my-reports`
- **Auth**: `Authorization: Bearer <token>`
- **Response (200 OK)**: `LocationReportRead[]`

### 7.3 Moderate / Resolve Report (Staff & Admin Only)
- **Method**: `PATCH`
- **Endpoint**: `/reports/{report_id}`
- **Auth**: Staff/Admin credentials
- **Request Body**:
```json
{
  "status": "resolved",
  "resolution_notes": "Security cleared pathway; ramp is now fully accessible."
}
```
- **Response (200 OK)**: `LocationReportRead`

---

## 8. TypeScript Interface Definitions

Frontend teams can copy these types directly into `@/types/campusway.ts`:

```typescript
export type UUID = string;

export type UserRole = "visitor" | "user" | "moderator" | "admin";

export type LocationType =
  | "building"
  | "gate"
  | "room"
  | "landmark"
  | "facility"
  | "food_court";

export type PathType =
  | "footpath"
  | "corridor"
  | "staircase"
  | "ramp"
  | "road_crossing"
  | "elevator";

export type NodeType =
  | "entrance"
  | "junction"
  | "corridor"
  | "staircase"
  | "ramp"
  | "gate"
  | "room_door";

export interface User {
  id: UUID;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in_seconds: number;
  user: User;
}

export interface LocationAlias {
  id: UUID;
  location_id: UUID;
  alias: string;
  normalized_alias: string;
}

export interface Location {
  id: UUID;
  name: string;
  slug: string;
  location_type: LocationType;
  parent_id: UUID | null;
  latitude: number | null;
  longitude: number | null;
  is_accessible: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationDetail extends Location {
  aliases: LocationAlias[];
  children: Location[];
}

export interface NavigationNode {
  id: UUID;
  location_id: UUID | null;
  node_type: NodeType;
  latitude: number;
  longitude: number;
  is_accessible: boolean;
  is_active: boolean;
}

export interface RouteSegment {
  edge_id: UUID;
  source_node_id: UUID;
  target_node_id: UUID;
  distance_m: number;
  path_type: PathType;
  is_accessible: boolean;
  instruction: string;
}

export interface RouteResponse {
  origin_node_id: UUID;
  destination_node_id: UUID;
  total_distance_m: number;
  estimated_time_seconds: number;
  is_accessible: boolean;
  nodes: NavigationNode[];
  segments: RouteSegment[];
}

export interface VisitorDestinationCard {
  id: UUID;
  name: string;
  slug: string;
  location_type: LocationType;
  latitude: number | null;
  longitude: number | null;
  has_routing_nodes: boolean;
  associated_node_id: UUID | null;
  aliases: string[];
}

export interface QRResolveResponse {
  is_valid: boolean;
  qr_type: "signpost" | "destination" | "room";
  location_id: UUID | null;
  node_id: UUID | null;
  location_name: string | null;
  location_type: LocationType | null;
  latitude: number | null;
  longitude: number | null;
  has_route_topology: boolean;
  message: string;
}

export interface FavoriteLocation {
  user_id: UUID;
  location_id: UUID;
  created_at: string;
  location?: Location;
}

export interface LocationReport {
  id: UUID;
  reporter_id: UUID | null;
  location_id: UUID | null;
  node_id: UUID | null;
  edge_id: UUID | null;
  report_type: "incorrect_info" | "inaccessible_path" | "blocked_path" | "missing_map_feature";
  status: "pending" | "reviewing" | "resolved" | "rejected";
  description: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}
```
