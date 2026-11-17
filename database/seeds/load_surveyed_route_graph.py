"""Compatibility wrapper delegating to the canonical SQLAlchemy seeder.

This wrapper ensures backward compatibility with commands referencing
database/seeds/load_surveyed_route_graph.py while executing the unified,
cross-database (SQLite & PostgreSQL) SQLAlchemy seeder.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add seeds directory to path
SEEDS_DIR = Path(__file__).resolve().parent
if str(SEEDS_DIR) not in sys.path:
    sys.path.insert(0, str(SEEDS_DIR))

from seed_surveyed_dataset_c import main

if __name__ == "__main__":
    sys.exit(main())
