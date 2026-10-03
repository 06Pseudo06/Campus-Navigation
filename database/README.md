# Database Management

This directory contains database schema migrations and data seeding scripts for CampusWay.

## Directory Structure

- `migrations/`: Schema definition files and migration scripts (Alembic / SQL).
- `seeds/`: Seed data scripts for official campus nodes, edges, buildings, gates, and landmarks once finalized.

## Strategy

1. Core schema models (Nodes, Edges, Locations, Entrances, Assistance Requests) will be defined collaboratively by the team.
2. Migrations will be managed using automated schema migration tools.
3. Accurate real-world campus survey coordinates and waypoint definitions will be populated via seed scripts.
