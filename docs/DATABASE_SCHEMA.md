# CampusWay — Database Schema Specification

## 1. Overview
The CampusWay database is built on PostgreSQL with strict relational integrity, UUID primary keys, UTC timestamp auditing, and geospatial coordinates for campus wayfinding.

The schema is managed using **Alembic** migrations and is 100% compatible with both local PostgreSQL containers and Neon Cloud PostgreSQL.

---

## 2. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_IDENTITIES : "has"
    USERS ||--o| USER_CREDENTIALS : "authenticates via"
    USERS ||--o{ USER_SESSIONS : "holds"
    USERS ||--o{ FAVORITES : "bookmarks"
    USERS ||--o{ LOCATION_REPORTS : "submits"
    USERS ||--o{ ASSISTANCE_REQUESTS : "requests"

    LOCATIONS ||--o{ LOCATIONS : "parent_of"
    LOCATIONS ||--o{ LOCATION_ALIASES : "identified_by"
    LOCATIONS ||--o{ NODES : "access_point"
    LOCATIONS ||--o{ FAVORITES : "bookmarked_in"
    LOCATIONS ||--o{ LOCATION_REPORTS : "referenced_in"
    LOCATIONS ||--o{ STAGED_LOCATIONS : "promoted_from"

    NODES ||--o{ EDGES : "source_for"
    NODES ||--o{ EDGES : "target_for"
    NODES ||--o{ LOCATION_REPORTS : "reported_at"

    MAP_IMPORT_BATCHES ||--o{ STAGED_LOCATIONS : "contains"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string phone
        string role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    USER_IDENTITIES {
        uuid id PK
        uuid user_id FK
        string provider
        string provider_user_id
        timestamp created_at
    }

    USER_CREDENTIALS {
        uuid id PK
        uuid user_id FK
        string password_hash
        timestamp created_at
        timestamp updated_at
    }

    USER_SESSIONS {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        string ip_address
        string user_agent
        boolean is_revoked
        timestamp expires_at
        timestamp revoked_at
        timestamp created_at
        timestamp updated_at
    }

    LOCATIONS {
        uuid id PK
        string name
        string slug UK
        string location_type
        uuid parent_id FK
        float latitude
        float longitude
        string address_details
        boolean is_accessible
        boolean is_verified
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    LOCATION_ALIASES {
        uuid id PK
        uuid location_id FK
        string alias
        string normalized_alias
    }

    NODES {
        uuid id PK
        uuid location_id FK
        string node_type
        float latitude
        float longitude
        boolean is_accessible
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    EDGES {
        uuid id PK
        uuid source_node_id FK
        uuid target_node_id FK
        float distance_m
        string path_type
        boolean is_bidirectional
        boolean is_accessible
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    FAVORITES {
        uuid user_id PK,FK
        uuid location_id PK,FK
        timestamp created_at
    }

    LOCATION_REPORTS {
        uuid id PK
        uuid reporter_id FK
        uuid location_id FK
        uuid node_id FK
        uuid edge_id FK
        string report_type
        string status
        string description
        string resolution_notes
        timestamp created_at
        timestamp resolved_at
    }

    MAP_IMPORT_BATCHES {
        uuid id PK
        string source_provider
        string source_reference
        string description
        string status
        int total_records
        int approved_records
        int rejected_records
        timestamp created_at
        timestamp completed_at
    }

    STAGED_LOCATIONS {
        uuid id PK
        uuid batch_id FK
        string external_element_type
        string external_element_id
        string source_url
        string proposed_name
        string proposed_location_type
        float latitude
        float longitude
        json original_tags
        string verification_status
        uuid canonical_location_id FK
        string rejection_reason
        timestamp created_at
        timestamp reviewed_at
    }

    ASSISTANCE_REQUESTS {
        uuid id PK
        string requester_name
        string contact_phone
        uuid user_id FK
        uuid current_location_id FK
        uuid current_node_id FK
        uuid target_location_id FK
        string assistance_type
        string description
        string status
        uuid assigned_to FK
        string resolution_notes
        timestamp created_at
        timestamp resolved_at
    }
```

---

## 3. Detailed Table Specifications

### 3.1 `users`
Core user identity for authentication, student/visitor sessions, and authorization.
- `id` (UUID, Primary Key, default `uuid4`)
- `email` (VARCHAR(255), Unique, Indexed, NOT NULL)
- `password_hash` (VARCHAR(255), NULL for OAuth-only users)
- `full_name` (VARCHAR(150), NULL)
- `phone` (VARCHAR(30), NULL)
- `role` (VARCHAR(50), NOT NULL, default `'user'`) — `'visitor'`, `'user'`, `'moderator'`, `'admin'`
- `is_active` (BOOLEAN, NOT NULL, default `TRUE`)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)

### 3.2 `locations`
Campus points of interest, academic blocks, entrance gates, facilities, and rooms.
- `id` (UUID, Primary Key, default `uuid4`)
- `name` (VARCHAR(200), NOT NULL, Indexed)
- `slug` (VARCHAR(220), Unique, NOT NULL, Indexed)
- `location_type` (VARCHAR(50), NOT NULL, Indexed) — `'building'`, `'gate'`, `'room'`, `'landmark'`, `'facility'`, `'food_court'`
- `parent_id` (UUID, Foreign Key -> `locations.id`, ON DELETE SET NULL, NULL)
- `latitude` (DOUBLE PRECISION, NULL)
- `longitude` (DOUBLE PRECISION, NULL)
- `address_details` (TEXT, NULL)
- `is_accessible` (BOOLEAN, NOT NULL, default `TRUE`)
- `is_verified` (BOOLEAN, NOT NULL, default `FALSE`)
- `is_active` (BOOLEAN, NOT NULL, default `TRUE`)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)

### 3.3 `nodes` (Routing Graph Vertices)
Navigational waypoints, road crossings, door access points, corridor intersections, and building gates.
- `id` (UUID, Primary Key, default `uuid4`)
- `location_id` (UUID, Foreign Key -> `locations.id`, ON DELETE SET NULL, NULL)
- `node_type` (VARCHAR(50), NOT NULL, default `'waypoint'`) — `'entrance'`, `'junction'`, `'corridor'`, `'gate'`, `'waypoint'`
- `latitude` (DOUBLE PRECISION, NOT NULL)
- `longitude` (DOUBLE PRECISION, NOT NULL)
- `is_accessible` (BOOLEAN, NOT NULL, default `TRUE`)
- `is_active` (BOOLEAN, NOT NULL, default `TRUE`)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)

### 3.4 `edges` (Routing Graph Segments)
Walkable connections between nodes with metric distances and accessibility flags.
- `id` (UUID, Primary Key, default `uuid4`)
- `source_node_id` (UUID, Foreign Key -> `nodes.id`, ON DELETE CASCADE, NOT NULL)
- `target_node_id` (UUID, Foreign Key -> `nodes.id`, ON DELETE CASCADE, NOT NULL)
- `distance_m` (DOUBLE PRECISION, NOT NULL, CHECK `distance_m > 0`)
- `path_type` (VARCHAR(50), NOT NULL, default `'footpath'`) — `'footpath'`, `'corridor'`, `'staircase'`, `'ramp'`, `'road_crossing'`
- `is_bidirectional` (BOOLEAN, NOT NULL, default `TRUE`)
- `is_accessible` (BOOLEAN, NOT NULL, default `TRUE`)
- `is_active` (BOOLEAN, NOT NULL, default `TRUE`)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)

### 3.5 `map_import_batches` & `staged_locations`
Provenance and staging pipeline for OpenStreetMap and surveyor GeoJSON data.
- Stores raw tags, external source URLs, verification state, and links to promoted canonical locations.

### 3.6 `assistance_requests`
Ticketing workflow for visitors and students needing wayfinding or mobility guidance.

---

## 4. Migration History & Alembic Chain

| Revision ID | Description | Created Tables / Columns |
| :--- | :--- | :--- |
| `001_initial_schema_v1` | Initial baseline schema | `users`, `user_identities`, `locations`, `location_aliases`, `nodes`, `edges`, `favorites`, `location_reports` |
| `002_map_import_provenance` | Map import pipeline & provenance | `map_import_batches`, `staged_locations` |
| `003_assistance_requests` | Visitor assistance & ticketing | `assistance_requests` |
| `004_report_resolution_notes` | Administrative report resolution | `location_reports.resolution_notes` column |

---

## 5. Shared Neon Cloud Database Safety Guidelines

1. **Zero Destructive Operations**: Never run `DROP TABLE`, `TRUNCATE`, or `alembic downgrade base` against shared cloud databases.
2. **Incremental Migrations Only**: All schema alterations must be scripted as additive, reversible Alembic revisions.
3. **Local Testing First**: Validate new migration revisions locally on an isolated test database (`pytest tests/test_migrations.py`) before applying to cloud instances.
