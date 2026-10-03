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
- **Database**: PostgreSQL 16.
- **Infrastructure**: Docker & Docker Compose.

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
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── map/
│   │   ├── locations/
│   │   └── ui/
│   ├── lib/                      # Utilities & API client
│   │   ├── api/
│   │   └── utils/
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # Shared frontend type definitions
│   ├── public/                   # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── .env.example
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
│   ├── requirements.txt
│   └── .env.example
│
├── database/                     # Database migrations & seeds
│   ├── migrations/               # Schema migration scripts
│   └── seeds/                    # Campus node/edge seed datasets
│
├── docs/                         # System architecture & API specifications
│   └── architecture.md
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (v3.10+ recommended)
- [Docker & Docker Compose](https://www.docker.com/) (optional, for containerized execution)

### Local Development Setup

#### 1. Running with Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/06Pseudo06/Campus-Navigation.git
cd Campus-Navigation

# Start all services (PostgreSQL, FastAPI backend, Next.js frontend)
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/api/v1/docs`

---

#### 2. Running Locally (Manual Setup)

**Frontend Setup:**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Backend Setup:**
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Open [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs) for interactive Swagger documentation.

---

## Development Principles & Team Workflow

This project is built by a 3-person team designed for parallel development:
- **Module Separation**: Clean boundaries between the Presentation/BFF Layer (Next.js) and the Campus Intelligence Service (FastAPI).
- **Code Standards**: TypeScript strict mode, Python type annotations, explicit error handling.
- **Maintainability**: Clear module interfaces, independently testable services, zero hardcoded secrets.
