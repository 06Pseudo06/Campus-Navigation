# CampusWay — System Architecture & Workflow Diagrams
**Project:** CampusWay (Lovely Professional University Smart Campus Navigation)  
**Academic Document Reference:** ARCH-DIAG-2026-V1  
**Audit Date:** November 24, 2026  
**Auditor:** Senior Full-Stack Engineering Architect & Academic Documentation Specialist  

---

## 1. High-Level System Architecture

This diagram illustrates the multi-tier architectural topology of CampusWay, showcasing client presentation, reverse-proxy gateway routing, FastAPI service modules, the spatial routing engine, and persistent storage layers.

```mermaid
flowchart TD
    subgraph Presentation["Presentation Tier (Client / Next.js 16 Turbopack)"]
        UI_Web["Web Browser Client (Desktop / Mobile)"]
        UI_Home["Architectural Homepage & Kinetic Atlas"]
        UI_Explore["Explore Dashboard & Mapbox GL Engine"]
        UI_QR["QR Wayfinding Scanner & Signpost Sheet"]
        UI_Admin["Administrative Control Centre Workspace (/admin)"]
        UI_Profile["User Profile & Saved Routes"]
    end

    subgraph Gateway["Application Services & API Gateway (FastAPI 0.110+)"]
        API_Router["FastAPI Core Router (/api/v1)"]
        Dep_Auth["Dual-Mode Auth Guard (Cookie / JWT / Admin Key)"]
        
        subgraph Services["Core Application Service Layer"]
            Svc_Auth["Auth & Identity Service (Argon2id / SHA-256)"]
            Svc_User["Resilient User Store (Postgres / In-Memory Fallback)"]
            Svc_Loc["Location & POI Catalog Service"]
            Svc_Graph["Spatial Graph & Routing Service"]
            Svc_Assist["Visitor Assistance & Triage Service"]
            Svc_Report["Issue Reporting Service"]
            Svc_Audit["Security Audit Logging Service"]
        end
    end

    subgraph RoutingEngine["Spatial Pathfinding Engine (C-Optimized Algorithms)"]
        Graph_Cache["In-Memory Topology Graph Cache (LRU/TTL)"]
        Dijkstra["Dijkstra Shortest Path Solver O((V+E) log V)"]
        AStar["A* Heuristic Solver (Haversine Heuristic)"]
        Directions["Turn-by-Turn Bearing Instruction Generator"]
    end

    subgraph DataStorage["Data Persistence Tier"]
        DB_Postgres[("Neon Serverless PostgreSQL (Production)")]
        DB_SQLite[("SQLite Dev Database (campusway_dev.db)")]
        Survey_JSON[("Canonical Dataset C (lpu_verified_survey.json)")]
    end

    %% Client Connections
    UI_Web --> UI_Home & UI_Explore & UI_QR & UI_Admin & UI_Profile
    UI_Home & UI_Explore & UI_QR & UI_Admin & UI_Profile -->|REST JSON + HTTPS| API_Router

    %% Gateway & Middleware
    API_Router --> Dep_Auth
    Dep_Auth --> Services

    %% Service to Routing Engine
    Svc_Graph --> Graph_Cache
    Graph_Cache --> Dijkstra & AStar
    Dijkstra & AStar --> Directions

    %% Service to Database
    Svc_Auth & Svc_User & Svc_Loc & Svc_Assist & Svc_Report & Svc_Audit --> DB_Postgres
    Svc_Auth & Svc_User & Svc_Loc & Svc_Assist & Svc_Report & Svc_Audit -.->|Fallback / Dev| DB_SQLite
    Survey_JSON -->|Seeded via seed_surveyed_dataset_c.py| DB_Postgres & DB_SQLite
```

---

## 2. Frontend / Backend / Database Interaction Flow

This sequence diagram depicts an end-to-end user navigation journey from initial POI lookup through route calculation, database retrieval, caching, and client-side polyline rendering.

```mermaid
sequenceDiagram
    autonumber
    actor User as Campus Pedestrian
    participant Browser as Next.js 16 Client (Explore Page)
    participant API as FastAPI Backend (/api/v1)
    participant Cache as In-Memory Graph Cache
    participant Engine as Dijkstra / A* Solver
    participant DB as Database (Postgres / SQLite)

    User->>Browser: Selects destination "Block 34" & clicks "Get Directions"
    Browser->>Browser: Evaluates starting position (GPS snapped or User Picked)
    Browser->>API: GET /api/v1/routing/route?origin_id={A}&destination_id={B}&accessible_only=false
    
    API->>Cache: Check for cached route (A, B, accessible_only)
    alt Cache Hit
        Cache-->>API: Return cached RouteResponse
    else Cache Miss
        API->>DB: Query active nodes and edges (if graph not in memory)
        DB-->>API: Return nodes & bidirectional edges
        API->>Cache: Build/Store CampusGraph adjacency list
        API->>Engine: Execute find_shortest_path(origin, dest)
        Engine->>Engine: Priority queue relaxation & predecessor backtracking
        Engine->>Engine: Compute bearing deltas & turn instructions (generate_step_directions)
        Engine-->>API: Enriched RouteResponse (segments, polyline coords, duration)
        API->>Cache: Store in Route Cache (TTL 5 min)
    end

    API-->>Browser: HTTP 200 OK (Route JSON)
    Browser->>Browser: Update GeoJSON source layer (route-polyline)
    Browser->>Browser: Render animated glow polyline & turn-by-turn cards
    Browser-->>User: Display distance, walking time (1.3 m/s), and map path
```

---

## 3. Dual-Mode Authentication & Session Security Flow

Demonstrates the cryptographic security pipeline supporting both web session cookies and mobile Bearer tokens with Argon2id password hashing and SHA-256 hashed database sessions.

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Browser
    participant AuthRoute as /api/v1/auth/login
    participant SecMgr as SecurityManager
    participant Store as ResilientUserRepository
    participant DB as Database (user_credentials & user_sessions)

    Client->>AuthRoute: POST { email, password, remember_me }
    AuthRoute->>Store: get_by_email(email)
    Store->>DB: SELECT * FROM users WHERE email = :email
    DB-->>Store: User record (UUID, role, is_active)
    
    AuthRoute->>Store: get_credentials(user_id)
    Store->>DB: SELECT password_hash FROM user_credentials WHERE user_id = :user_id
    DB-->>Store: Argon2id hash string

    AuthRoute->>SecMgr: verify_password(password, password_hash)
    SecMgr->>SecMgr: Argon2id constant-time verification
    alt Invalid Password
        SecMgr-->>AuthRoute: False
        AuthRoute-->>Client: HTTP 401 Unauthorized ("Invalid credentials")
    else Valid Password
        SecMgr-->>AuthRoute: True
        AuthRoute->>SecMgr: generate_session_token()
        SecMgr-->>AuthRoute: Raw crypto-random token (plaintext)
        AuthRoute->>SecMgr: hash_token(raw_token) -> SHA-256
        AuthRoute->>Store: create_session(user_id, token_hash, expires_at)
        Store->>DB: INSERT INTO user_sessions (user_id, token_hash, expires_at)
        
        AuthRoute->>SecMgr: create_jwt_access_token(user_id, email, role)
        SecMgr-->>AuthRoute: Signed JWT string
        
        AuthRoute-->>Client: HTTP 200 OK + Set-Cookie: campusway_session={raw_token} (HttpOnly, Secure, SameSite=Lax)
    end
```

---

## 4. Campus Navigation & Spatial Routing Pipeline

Detailed operational pipeline of the shortest-path algorithm, walking time estimation, and turn-by-turn direction enrichment.

```mermaid
flowchart TD
    Start([Route Request Received]) --> ValidateEndpoints{Are Origin & Dest Valid Active Nodes?}
    ValidateEndpoints -- No --> Err404[Return HTTP 404 / Route Unavailable]
    ValidateEndpoints -- Yes --> CheckSame{Origin == Destination?}
    CheckSame -- Yes --> ZeroDist[Return 0m Distance, Single Node, No Segments]
    CheckSame -- No --> CheckAlgo{Selected Algorithm}

    CheckAlgo -- Dijkstra --> RunDijkstra["Dijkstra Solver: Initialize pq=[(0, origin)], best_dist={origin: 0}"]
    CheckAlgo -- A* --> RunAStar["A* Solver: Heuristic h(n)=Haversine(n, dest), pq=[(h, 0, origin)]"]

    subgraph PathfindingLoop["Priority Queue Search Loop"]
        PopNode["Pop node with minimum cost/f_score from heapq"]
        IsDest{"Current == Destination?"}
        PopNode --> IsDest
        IsDest -- Yes --> BreakLoop[Break Search Loop]
        IsDest -- No --> Neighbors["Iterate over adjacent edges (graph.get_neighbors)"]
        Neighbors --> AccessibleCheck{"accessible_only AND edge NOT accessible?"}
        AccessibleCheck -- Yes --> SkipEdge[Skip Edge]
        AccessibleCheck -- No --> WeightCheck{"Edge distance <= 0?"}
        WeightCheck -- Yes --> SkipEdge
        WeightCheck -- No --> Relax["Relax Edge: tentative_cost = curr_dist + edge_dist"]
        Relax --> IsBetter{"tentative_cost < best_dist[neighbor]?"}
        IsBetter -- Yes --> Update["best_dist[neighbor] = tentative_cost<br/>predecessors[neighbor] = (curr, edge)<br/>heappush(pq)"]
        IsBetter -- No --> SkipEdge
    end

    RunDijkstra --> PopNode
    RunAStar --> PopNode
    BreakLoop --> Reconstruct["Backtrack predecessors from dest to origin (O(V))"]
    Reconstruct --> BearingGen["Calculate geographic bearings between successive node pairs"]
    BearingGen --> TurnModifier["Compute relative angle delta: straight, turn right, turn left, U-turn"]
    TurnModifier --> DurationEst["Calculate walking duration (distance / 1.3 m/s)"]
    DurationEst --> FormatResponse["Assemble RouteResponse JSON (polyline, steps, duration, total_distance)"]
    FormatResponse --> End([Deliver Enriched Route to Client])
```

---

## 5. Real-Time GPS Snapping & Off-Route Rerouting Flow

Depicts the real-time browser Geolocation API interaction, accuracy threshold evaluation, graph snapping, and dynamic reroute triggering.

```mermaid
flowchart TD
    StartGPS([Browser Geolocation Watcher Event]) --> CheckAcc{"accuracy <= 50m?"}
    CheckAcc -- No --> LowAccState["Status: 'low_accuracy'<br/>Render pulsing amber circle<br/>Do not snap to network"]
    CheckAcc -- Yes --> CheckCampus{"isWithinCampusBounds(lat, lng)?"}
    CheckCampus -- No --> OutOfCampus["Status: 'out_of_range'<br/>Display 'Outside Campus Bounds' HUD"]
    CheckCampus -- Yes --> SnapNearest["Compute distance to all active nodes via Haversine"]
    
    SnapNearest --> DistCheck{"distance to nearest node <= 75m?"}
    DistCheck -- No --> UnsurveyedArea["Status: 'out_of_range' (Unsurveyed Area)<br/>Compute nearest 3 surveyed places + compass directions<br/>Render directional arrow toward surveyed network"]
    DistCheck -- Yes --> Snapped["Status: 'snapped'<br/>Snap user coordinates to nearest graph Node ID"]

    Snapped --> ActiveNavCheck{"Is user actively navigating a calculated route?"}
    ActiveNavCheck -- No --> StandbyMap["Update Blue Dot Marker & Heading Cone on Mapbox"]
    ActiveNavCheck -- Yes --> OffRouteCheck{"Distance from user to active route polyline > 25m?"}
    OffRouteCheck -- No --> AdvanceStep["Update turn step progress indicator"]
    OffRouteCheck -- Yes --> TriggerReroute["Trigger Automatic Dynamic Reroute:<br/>Origin = newly snapped Node ID<br/>Dest = original target Destination<br/>Fetch updated route in background"]
    TriggerReroute --> RedrawRoute["Smoothly update route polyline & guidance instructions"]
```

---

## 6. QR-Based Wayfinding & Deep-Link Resolution Flow

Illustrates destination-encoded physical QR signposts, camera scanner capture, optical decoding, parameter sanitization, and automatic route dispatch.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Campus Visitor / Student
    participant Signpost as Physical Campus Signpost
    participant Scanner as Html5Qrcode Scanner Modal
    participant Sanitizer as parseNavigateParams & Validator
    participant Router as Next.js Navigation Engine (/navigate)
    participant Explore as Explore Interactive Map

    Visitor->>Signpost: Scans signpost QR code with smartphone camera
    alt System Camera Scan
        Signpost-->>Visitor: Direct deep link: https://campusway.lpu.in/navigate?to=block-34
        Visitor->>Router: Browser opens deep link
    else In-App Scanner Modal
        Visitor->>Scanner: Opens CampusWay Scanner Modal
        Scanner->>Scanner: Video stream frames / Torch toggle / Photo upload
        Scanner-->>Scanner: Optical QR decoded: "campusway://navigate?to=B34"
        Scanner->>Router: Redirects to /navigate?to=B34
    end

    Router->>Sanitizer: parseNavigateParams(query)
    Sanitizer->>Sanitizer: Strip dangerous characters, enforce 100 char limit
    Sanitizer->>Sanitizer: validateLocationIdentifier("B34", VERIFIED_DATASET_C_LOCATIONS)
    Sanitizer-->>Router: Matched Location ("Block 34", slug: "block-34", node_id: "...")

    Router->>Explore: Redirects to /explore with destination pre-selected
    Explore->>Explore: Evaluates origin (current GPS location or Campus Gate 1)
    Explore->>Explore: Automatically triggers route generation & pans viewport
    Explore-->>Visitor: Renders highlighted route and walking directions
```

---

## 7. Administrative Workspace & Security Governance Flow

Flowchart showing administrative operations, role validation, last-admin protection, cache purging, and immutable audit recording.

```mermaid
flowchart TD
    AdminUser([Operator Navigates to /admin]) --> CheckAuth{Is Client Authenticated?}
    CheckAuth -- No --> RedirectLogin["Redirect to /login?redirect=/admin"]
    CheckAuth -- Yes --> CheckRole{"user.role == 'admin'?"}
    CheckRole -- No --> Show403["Render 403 Forbidden Access Card<br/>(Restricted to verified campus operators)"]
    CheckRole -- Yes --> AllowWorkspace["Load Operations Console Layout & Sidebar"]

    AllowWorkspace --> ActionChoice{Operator Action}
    
    %% Action 1: Demote or Deactivate User
    ActionChoice -- Demote / Deactivate User --> AdminGuard{"Is target user an active Admin AND total active admins <= 1?"}
    AdminGuard -- Yes --> RejectAction["Reject with HTTP 400 Bad Request:<br/>'Cannot demote/deactivate the last active administrator'"]
    AdminGuard -- No --> ExecuteUserUpdate["Update user role / status in PostgreSQL<br/>Record audit event: 'user.role.update' in audit_logs"]

    %% Action 2: Purge Cache
    ActionChoice -- Purge Routing Cache --> FlushMemory["Call invalidate_graph_cache()<br/>Clear _GRAPH_CACHE and _ROUTE_CACHE<br/>Record audit event: 'routing.cache.clear' in audit_logs"]

    %% Action 3: Add / Verify Location
    ActionChoice -- Modify Campus POI --> CheckProvenance["Validate WGS84 coordinates & Dataset C provenance<br/>Save to locations table<br/>Record audit event in audit_logs"]

    %% Action 4: Triage Reports
    ActionChoice -- Triage Issue / Assistance --> UpdateTicket["Update status to resolved / assigned<br/>Save resolution notes to database"]
```

---

## 8. Database Entity-Relationship (ER) Diagram

Represents the relational database schema implemented in PostgreSQL (Neon) and mirrored in development SQLite, with primary keys, foreign keys, cardinality, and constraints.

```mermaid
erDiagram
    users ||--o{ user_identities : "has"
    users ||--o| user_credentials : "authenticates via"
    users ||--o{ user_sessions : "maintains"
    users ||--o{ favorites : "saves"
    users ||--o{ location_reports : "submits"
    users ||--o{ audit_logs : "acts as actor in"

    locations ||--o{ location_aliases : "known by"
    locations ||--o{ nodes : "represented by"
    locations ||--o{ favorites : "favorited in"
    locations ||--o{ location_reports : "reported in"
    locations ||--o| locations : "parent of"

    map_import_batches ||--o{ staged_locations : "contains"
    staged_locations }o--o| locations : "promoted to"

    nodes ||--o{ edges : "source of"
    nodes ||--o{ edges : "target of"
    nodes ||--o{ location_reports : "reported in"

    edges ||--o{ location_reports : "reported in"

    users {
        uuid id PK
        string full_name
        string email UK
        string phone UK
        string role "student | admin | moderator"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    user_credentials {
        uuid id PK
        uuid user_id FK,UK
        string password_hash "Argon2id"
        timestamp created_at
        timestamp updated_at
    }

    user_sessions {
        uuid id PK
        uuid user_id FK
        string token_hash UK "SHA-256"
        timestamp expires_at
        timestamp created_at
        timestamp last_activity_at
        boolean is_revoked
    }

    user_identities {
        uuid id PK
        uuid user_id FK
        string provider "google"
        string provider_user_id
        timestamp created_at
    }

    locations {
        uuid id PK
        uuid parent_id FK
        string name
        string slug UK
        string location_type
        text description
        float latitude
        float longitude
        text address_details
        boolean is_verified
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    location_aliases {
        uuid id PK
        uuid location_id FK
        string alias
        string normalized_alias
        string language
        timestamp created_at
    }

    nodes {
        uuid id PK
        uuid location_id FK
        string node_type "junction | entrance | gate"
        float latitude
        float longitude
        boolean is_accessible
        boolean is_active
        timestamp created_at
    }

    edges {
        uuid id PK
        uuid source_node_id FK
        uuid target_node_id FK
        float distance_m
        string path_type "footpath | stairs | ramp"
        boolean is_bidirectional
        boolean is_accessible
        boolean is_active
        timestamp created_at
    }

    assistance_requests {
        uuid id PK
        string requester_name
        string contact_phone
        string assistance_type "lost_visitor | mobility | general"
        text description
        string status "pending | assigned | resolved"
        text resolution_notes
        timestamp created_at
        timestamp resolved_at
    }

    location_reports {
        uuid id PK
        uuid reporter_id FK
        uuid location_id FK
        uuid node_id FK
        uuid edge_id FK
        string report_type "blocked_path | incorrect_info | accessibility"
        text description
        string status "pending | reviewing | resolved | rejected"
        text resolution_notes
        timestamp created_at
        timestamp resolved_at
    }

    audit_logs {
        uuid id PK
        uuid actor_id FK
        string actor_email
        string action "user.role.update | cache.clear"
        string entity_type "user | location | routing | system"
        string entity_id
        text details "JSON payload"
        string ip_address
        timestamp created_at
    }
```
