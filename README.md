# CampusWay | Campus Navigation & Wayfinding System

> **Problem Statement (P10 – Which Block Is 34?: Campus Wayfinding Problem)**  
> First-time visitors and new students frequently get lost among numbered blocks, gates, and internal roads because existing static signage and standard maps do not match how newcomers actually navigate university campuses.

CampusWay is a modern, architectural campus wayfinding platform designed to provide intuitive point-to-point route planning, gate QR integrations, and visitor assistance.

---

## Current Project Status

> [!NOTE]  
> **Development Phase: Foundation & Architecture Setup**  
> This repository is in its initial foundation stage. The core directory structures, Next.js App Router routing skeletons, FastAPI route intelligence services, Docker Compose configurations, and module boundaries are established.  
> 
> *Actual route calculation algorithms (Dijkstra/A\*), real campus node data, map rendering engines, and authentication flows will be implemented in subsequent phases.*

---

## Core Functional Modules

1. **Campus Map Service**
   - Searchable campus locations (Buildings, Gates, Rooms, Landmarks).
   - Architectural, accessible campus mapping and points of interest.

2. **Route Planning & Intelligence Service**
   - Gate-to-building and gate-to-room walking route calculation.
   - Graph-based pathfinding (Dijkstra / A\*) with distance and walking time estimation.
   - Human-readable step-by-step navigation instructions.

3. **Visitor Assistance Service**
   - Gate QR code entrance handling (instant origin location detection).
   - Destination guidance and route sharing.
   - Assistance request dispatching for lost visitors.

---

## High-Level Architecture & Tech Stack

```
                          ┌───────────────────────────┐
                          │   Visitor / Student UI    │
                          │      (Web / Mobile)       │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Application Layer                       │
│  - Presentation UI & Swiss Wayfinding Aesthetics                       │
│  - App Router Structure: /, /explore, /locations, /navigate, /help     │
│  - Admin Portal: /admin/login, /admin/dashboard                        │
│  - Visitor Search & Wayfinding Experience                              │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│              FastAPI Campus Intelligence & Route Service               │
│  - In-memory Campus Graph (Nodes, Edges, Weights)                      │
│  - Shortest & Optimal Path Calculation (Dijkstra / A*)                 │
│  - Step-by-step turn directions generator                             │
│  - Geospatial & path optimization                                      │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL Database                           │
│  - Campus Topology (Waypoints, Intersections, Paths)                   │
│  - Venue Data (Buildings, Entrances, Rooms, Landmarks)                 │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0.
- **Database**: PostgreSQL 16 (Native, Cloud-hosted, or containerized).
- **Containerization (Optional)**: Docker & Docker Compose.

---

## Repository Structure

```
Campus-Navigation/
├── frontend/                     # Next.js Application Layer
│   ├── app/                      # App Router Pages
│   │   ├── (public)/             # Public wayfinding routes
│   │   │   ├── page.tsx          # Home page (/)
│   │   │   ├── explore/          # Campus exploration (/explore)
│   │   │   ├── locations/        # Location details (/locations/[locationId])
│   │   │   ├── navigate/         # Route planning (/navigate)
│   │   │   └── help/             # Visitor assistance (/help)
│   │   ├── admin/                # Admin interface
│   │   │   ├── login/            # Admin auth (/admin/login)
│   │   │   └── dashboard/        # Management (/admin/dashboard)
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global Tailwind styling
│   ├── components/               # Reusable UI & Layout Components
│   ├── lib/                      # Utilities & API client
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # Shared frontend type definitions
│   ├── public/                   # Static assets
│   ├── package.json              # Frontend dependencies and npm scripts
│   ├── package-lock.json         # Lockfile
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   ├── .dockerignore             # Docker build exclusions
│   ├── Dockerfile                # Optional container image definition
│   └── .env.example              # Frontend environment variables template
│
├── backend/                      # FastAPI Route Intelligence Service
│   ├── app/
│   │   ├── main.py               # FastAPI entry point & CORS
│   │   ├── api/                  # API routers & dependency injection
│   │   │   ├── routes/
│   │   │   │   ├── locations.py  # Location endpoints
│   │   │   │   ├── routing.py    # Route calculation endpoints
│   │   │   │   └── assistance.py # Assistance endpoints
│   │   │   └── dependencies.py
│   │   ├── core/                 # Config & Database sessions
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic schemas
│   │   └── services/             # Business & graph intelligence logic
│   │       └── routing/
│   │           ├── graph.py      # Campus graph representation
│   │           ├── algorithms.py # Dijkstra / A* algorithms
│   │           └── directions.py # Turn-by-turn instruction builder
│   ├── tests/                    # Pytest test suite
│   ├── requirements.txt          # Python dependencies
│   ├── .dockerignore             # Docker build exclusions
│   ├── Dockerfile                # Optional container image definition
│   └── .env.example              # Backend environment variables template
│
├── database/                     # Database migrations & seeds
│   ├── migrations/               # Schema migration scripts (Alembic placeholder)
│   └── seeds/                    # Campus node/edge seed datasets
│
├── docs/                         # System architecture & API specifications
│   └── architecture.md
│
├── .gitignore                    # Git exclusions
├── docker-compose.yml            # Optional multi-service orchestration
└── README.md
```

---

## Development Workflows

CampusWay supports two decoupled workflows:
1. **Standard Native Development (Default)**: For day-to-day development. Developers install Node.js and Python dependencies natively on their machine. Docker is not required, installed, or started.
2. **Docker Development (Optional)**: For running the entire containerized stack via Docker Compose.

---

### Workflow 1: Standard Native Development (Default)

#### Prerequisites & Supported Versions

| Dependency | Supported Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.18.0` (Node 20 LTS recommended) | Required for Next.js 15 |
| **npm** | `>= 9.0.0` | Uses committed `frontend/package-lock.json` |
| **Python** | `>= 3.11` (Python 3.11 – 3.13 tested) | Required for FastAPI & Pydantic v2 |
| **PostgreSQL** | `16` (Optional in Foundation Phase) | Local native instance or shared cloud DB |

> [!NOTE]  
> In the current foundation phase, backend API endpoints run without requiring an active PostgreSQL connection. Database configuration is driven entirely by environment variables.

#### 1. Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create your local environment configuration:
   ```bash
   cp .env.example .env.local
   ```

3. Install dependencies using npm:
   ```bash
   npm install
   ```

4. Start the native Next.js development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Additional native verification scripts:
   - Type check: `npm run type-check`
   - Lint check: `npm run lint`
   - Production build: `npm run build`

---

#### 2. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # On Windows (Command Prompt / PowerShell):
   venv\Scripts\activate
   # On macOS/Linux:
   # source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your settings or database connection if using a database.

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - Interactive Swagger API Documentation: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
   - Alternative ReDoc Documentation: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)
   - Health check endpoint: [http://localhost:8000/health](http://localhost:8000/health)

6. Run automated test suite:
   ```bash
   pytest tests
   ```

---

#### 3. Database & Migrations Configuration

- **Environment-Driven Connection**: The backend loads `DATABASE_URL` from the environment or `.env`.
  - **Local Native PostgreSQL**: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campusway_db`
  - **Authorized Shared Cloud PostgreSQL** (e.g. Supabase, Neon, AWS RDS):
    `DATABASE_URL=postgresql://<user>:<password>@<db-host>:5432/<dbname>?sslmode=require`
- **Alembic Migrations Status**:
  - Alembic migrations are **not yet configured** in this repository. `database/migrations/` currently contains a placeholder `.gitkeep`.
  - No database migration commands need to be executed at this stage.
  - When ORM models are finalized in `backend/app/models/`, Alembic migration commands (`alembic upgrade head`) will be introduced.

---

### Workflow 2: Docker Development (Optional)

Developers who have Docker and Docker Compose installed can optionally run all services in containers without installing native Node.js or Python environments.

#### Prerequisites
- [Docker Engine / Docker Desktop](https://www.docker.com/)
- [Docker Compose v2+](https://docs.docker.com/compose/)

#### Commands

From the repository root:

1. **Build and start all services (PostgreSQL, FastAPI backend, Next.js frontend)**:
   ```bash
   docker compose up --build
   ```

2. **Run in detached (background) mode**:
   ```bash
   docker compose up -d
   ```

3. **View logs**:
   ```bash
   docker compose logs -f
   ```

4. **Stop all containers and networks**:
   ```bash
   docker compose down
   ```

5. **Stop containers and delete data volume**:
   ```bash
   docker compose down -v
   ```

#### Container Networking
- Inside the Docker network, the backend automatically targets `postgres:5432` as defined in `docker-compose.yml`.
- Ports `3000` (Frontend), `8000` (Backend API), and `5432` (PostgreSQL) are published to `localhost` on the host machine.
- Native build directories and caches (`node_modules/`, `.next/`, `venv/`, `__pycache__/`) are excluded from container images via `backend/.dockerignore` and `frontend/.dockerignore`.

---

## Development Principles & Team Workflow

This project is built by a 3-person team designed for parallel development:
- **Zero Mandatory Docker**: Any teammate can clone the repo and develop natively using standard Node.js and Python tooling.
- **Docker as an Optional Tool**: Container configurations remain fully functional and isolated for developers who prefer Docker.
- **Module Separation**: Clean boundaries between the Presentation Layer (Next.js) and the Route Intelligence Service (FastAPI).
- **Code Standards**: TypeScript strict mode, Python type annotations, explicit error handling.
- **Maintainability**: Clear module interfaces, independently testable services, zero hardcoded secrets.
