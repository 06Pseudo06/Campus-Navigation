# CampusWay Database Management (Schema v1)

This directory contains version-controlled database schema migrations and data seeding scripts for CampusWay, designed around PostgreSQL 16 and managed via Alembic.

---

## 1. Directory Structure

- `migrations/`: Alembic environment and schema revision scripts.
  - `env.py`: Migration runtime context, dynamically loading SQLAlchemy metadata from `app.models.Base`.
  - `script.py.mako`: Template for newly generated migration revisions.
  - `versions/001_initial_schema_v1.py`: Baseline migration establishing the 8 approved schema v1 tables.
- `seeds/`: Placeholder directory for planned official campus survey coordinates, waypoints, and landmark seeds.

---

## 2. Database Architecture & Schema v1 Entities

The database uses **UUIDv4** primary keys and **TIMESTAMPTZ** timestamps for all entities. Deletions on core navigation entities favor soft deactivation (`is_active = FALSE`) over destructive row deletion to preserve graph topology and issue history.

| Entity | Purpose | Key Constraints & Policies |
| :--- | :--- | :--- |
| `users` | Core application user profile (role, email, phone). | Role constrained to `student`, `admin`, `moderator`. No passwords/tokens. |
| `user_identities` | Integration boundary for external authentication (Google OAuth, Phone OTP). | `UNIQUE (provider, provider_subject)`, `ON DELETE CASCADE` from `users`. |
| `locations` | Searchable campus destinations (buildings, blocks, rooms, gates, landmarks). | Self-referencing `parent_id` for hierarchy; lat/long bounds [-90, 90], [-180, 180]; unique `slug`. |
| `location_aliases` | Search synonyms, acronyms, and abbreviations. | `UNIQUE (location_id, normalized_alias)`, normalized lowercase tokens. |
| `nodes` | Waypoints and vertices in the pedestrian routing graph. | Coordinate range checks; foreign key to `locations` (`ON DELETE SET NULL`). |
| `edges` | Walkable connections between navigation nodes. | Positive metric distance (`distance_m > 0`); self-loop prevention (`source != target`). |
| `favorites` | Bookmarked campus places per user. | Composite primary key `(user_id, location_id)`; cascades on deletion of either entity. |
| `location_reports` | Crowdsourced issue reports (missing place, wrong pin, blocked path). | Requires at least one target (`location_id`, `node_id`, `edge_id`); status check in `('pending', 'reviewing', 'resolved', 'rejected')`. |

---

## 3. Configuration & Environment Variables

The database connection is configured via the environment or `.env` files located in the project root or `backend/`:

| Environment Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Primary PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/campusway_db` |
| `ALEMBIC_DATABASE_URL` | Optional override for running migrations against test or staging DB | `postgresql://postgres:postgres@localhost:5432/campusway_test` |
| `ADMIN_API_KEY` | Development key for administrative endpoints | `campusway-admin-dev-secret` |

### Supported Connection Schemes:
- **Local Native PostgreSQL**: `postgresql://postgres:postgres@localhost:5432/campusway_db`
- **Docker Compose PostgreSQL**: `postgresql://postgres:postgres_password@postgres:5432/campusway_db`
- **Cloud PostgreSQL (Neon / Supabase / AWS RDS)**: `postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require`

---

## 4. Alembic Migration Commands

Alembic can be run from the repository root or from within the `backend/` directory:

### Run Migrations to Latest Head
```bash
# From repository root:
alembic upgrade head

# Or from backend/ directory:
cd backend
alembic upgrade head
```

### Check Current Migration Status
```bash
alembic current
alembic heads
```

### Roll Back Latest Migration Safely (Development Only)
```bash
# Roll back the single latest revision
alembic downgrade -1

# Or roll back all migrations to base (disposable test database only)
alembic downgrade base
```

### Inspect SQL Without Live Database Connection (Offline Mode)
```bash
alembic upgrade base:head --sql
```

> [!WARNING]
> **Database Safety Notice:** Never execute destructive resets (`DROP DATABASE`, `alembic downgrade base`) against shared team databases (e.g. shared Neon PostgreSQL). Always verify the target connection string before running migrations.

---

## 5. Walkable Path Representation (Edges)

The navigation engine distinguishes between directed and bidirectional pathways:
- `is_bidirectional = TRUE`: Pathway can be traversed in both directions (`source -> target` and `target -> source`) at equal metric distance `distance_m`.
- `is_bidirectional = FALSE`: Pathway is strictly one-way (`source -> target`).
- **Initial Cost Metric**: The pathfinding engine utilizes `distance_m` as the initial routing weight without premature travel-time assumptions.

---

## 6. Authentication Integration Boundary

The `users` and `user_identities` tables form the designated integration boundary for the teammate implementing authentication:
- **No Credentials Stored**: Password hashes, JWT tokens, and OTP codes are strictly excluded from the database schema.
- **Provider Linkage**: Once the authentication teammate implements Google sign-in or mobile OTP, the external subject ID is linked into `user_identities(provider, provider_subject)` referencing the internal `users.id`.

---

## 7. Administrative Authorization & Operational Safeguards

- **Administrative Endpoints Guarded**: Write operations on locations, nodes, edges, and report reviews are guarded by `require_admin_role`, requiring `X-Admin-Key` or `Authorization: Bearer <key>`.
- **User Scoped Favorites**: Favorites operations require `X-User-ID` matching the owner, preventing cross-user tampering.
- **Duplicate Edge Prevention**: Graph edge creation enforces active forward uniqueness and detects conflicting reverse bidirectional edges.
- **Dijkstra Inactive Node Isolation**: Edges are only registered in memory if both endpoint nodes are active, ensuring deactivated waypoints are never traversed.
