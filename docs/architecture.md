# CampusWay System Architecture

## Overview

CampusWay is an architectural campus navigation and wayfinding platform designed to resolve the campus wayfinding challenge ("Which Block Is 34?").

```
                          ┌───────────────────────────┐
                          │   Visitor / Student UI    │
                          │      (Web / Mobile)       │
                          └─────────────┬─────────────┘
                                        │
                         HTTP / REST    │
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Next.js Application Layer                     │
│  - Presentation UI & Swiss/Wayfinding Design Identity                  │
│  - App Router Pages (/explore, /locations, /navigate, /help, /admin)   │
│  - Visitor Experience & Search Interface                               │
│  - Admin Dashboard & Authentication Flow                               │
│  - BFF / API Gateway logic                                             │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │
                         Internal REST  │
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  FastAPI Campus Intelligence & Route Service           │
│  - Campus Graph in-memory representation (Nodes & Edges)               │
│  - Routing Engine (Dijkstra / A* pathfinding)                          │
│  - Distance calculation & walking time estimation                      │
│  - Turn-by-turn navigation step generation                             │
│  - Assistance coordination                                             │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL Database                          │
│  - Campus Topology (Waypoints, Intersections, Corridors)               │
│  - Points of Interest (Buildings, Gates, Rooms, Landmarks)             │
│  - Admin metadata & Assistance tickets                                 │
└────────────────────────────────────────────────────────────────────────┘
```

## Architectural Separation

### Next.js (Application Layer)
- **Frontend UI & Pages**: Implements public wayfinding views, search inputs, responsive map rendering, and administrative portals.
- **Visitor Interactions**: Handles destination search, QR scan intake (Gate entry), and step display.
- **Authentication**: Admin auth flow.

### FastAPI (Route Intelligence Service)
- **Campus Graph**: Represents walkable campus nodes (gates, junctions, building entrances, room coordinates) and weighted edges (path distance, accessibility flags, walking time).
- **Route Calculation**: Executes graph search algorithms (Dijkstra, A*) to find optimal walking paths.
- **Directions Generator**: Produces human-readable step-by-step instructions (e.g., "Enter Gate 1, proceed 50m straight past Block 25 to Block 34").

### PostgreSQL (Persistent Storage)
- Stores node-edge topologies, venue metadata, and system configuration.
