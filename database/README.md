# Database Management

This directory contains database schema migrations and data seeding scripts for CampusWay.

## Directory Structure

- `migrations/`: Schema definition files and migration scripts (Alembic / SQL). Currently unconfigured placeholder (`.gitkeep`); migrations will be initialized once ORM models are finalized.
- `seeds/`: Seed data scripts for official campus nodes, edges, buildings, gates, and landmarks once finalized.

## Strategy & Current Status

1. **Current Status**: Alembic migration scripts are not yet generated. The repository is in its initial foundation stage; API endpoints operate with in-memory structures or mock responses and do not yet execute database queries.
2. **Schema Models**: Core schema models (Nodes, Edges, Locations, Entrances, Assistance Requests) will be defined collaboratively in `backend/app/models/`.
3. **Database Connection**: Developers can connect to either:
   - A local native PostgreSQL 16 instance (`localhost:5432`)
   - An authorized shared cloud PostgreSQL database (e.g., Supabase, Neon, AWS RDS)
   - An optional containerized PostgreSQL instance via `docker compose`
4. **Migrations Setup (Future Step)**: Once models are defined, Alembic will be initialized via `alembic init database/migrations` and migration commands (`alembic revision --autogenerate`, `alembic upgrade head`) will be documented.
5. Accurate real-world campus survey coordinates and waypoint definitions will then be populated via seed scripts.
