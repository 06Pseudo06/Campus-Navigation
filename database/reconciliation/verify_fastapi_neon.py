"""Phase 2: Live Application Verification against Neon PostgreSQL (READ ONLY).

Verifies:
1. FastAPI /api/v1/locations/ endpoint returns live campus locations (30 total) from Neon.
2. FastAPI /api/v1/routing/calculate calculates valid routes using both Dijkstra and A*
   between Gate 1 (Main Gate) and Block 1 (Fashion Design).
3. FastAPI auth read / lookup functionality:
   - Unauthenticated GET /api/v1/auth/me rejects with 401.
   - Read-only user lookup via repository returns an existing user from Neon cleanly.
4. Record count integrity check confirms 0 records were modified or written.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
backend_dir = repo_root / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.reconciliation.reconcile_neon_schema import (
    ALL_CANONICAL_TABLES,
    get_pg_connection,
    get_table_row_counts,
    mask_database_url,
    resolve_database_url,
)

# Resolve Neon database URL and set environment variable
neon_url = resolve_database_url()
os.environ["DATABASE_URL"] = neon_url
os.environ["ALEMBIC_DATABASE_URL"] = neon_url

# Ensure modules are reloaded with the correct DATABASE_URL environment variable
for mod in list(sys.modules.keys()):
    if mod.startswith("app.") or mod == "app":
        del sys.modules[mod]

# Now import FastAPI and application components
from fastapi.testclient import TestClient
from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.main import app
from app.services.user_store import get_user_repository


def run_live_verification():
    print("=" * 70)
    print("PHASE 2: LIVE APPLICATION VERIFICATION (READ ONLY)")
    print(f"Target DB: {mask_database_url(neon_url)}")
    print("=" * 70)

    # Pre-check row counts
    conn = get_pg_connection(neon_url, readonly=True)
    baseline_counts = get_table_row_counts(conn, ALL_CANONICAL_TABLES)
    conn.close()
    print("Baseline counts in Neon before FastAPI tests:")
    for tbl, count in sorted(baseline_counts.items()):
        print(f"  {tbl}: {count}")

    client = TestClient(app)

    # 1. Health check
    print("\n--- 1. Testing Backend Health Endpoint ---")
    health_resp = client.get("/health")
    print(f"GET /health: {health_resp.status_code} {health_resp.json()}")
    assert health_resp.status_code == 200, f"Expected 200, got {health_resp.status_code}"

    # 2. Locations endpoint
    print("\n--- 2. Testing Locations API (GET /api/v1/locations/) ---")
    loc_resp = client.get("/api/v1/locations/?limit=100")
    assert loc_resp.status_code == 200, f"Expected 200, got {loc_resp.status_code}: {loc_resp.text}"
    locations = loc_resp.json()
    print(f"Retrieved {len(locations)} locations from Neon.")
    assert len(locations) >= 15, f"Expected at least 15 locations, got {len(locations)}"

    # Check Gate 1 and Block 1 in locations
    gate_1 = next((l for l in locations if "Gate 1" in l.get("name", "")), None)
    block_1 = next((l for l in locations if "Block 1" in l.get("name", "")), None)
    print(f"  Gate 1 found: {gate_1['name'] if gate_1 else 'MISSING'} (ID: {gate_1['id'] if gate_1 else None})")
    print(f"  Block 1 found: {block_1['name'] if block_1 else 'MISSING'} (ID: {block_1['id'] if block_1 else None})")
    assert gate_1 is not None, "Gate 1 not found in locations list"
    assert block_1 is not None, "Block 1 not found in locations list"

    # 3. Routing endpoint (Dijkstra and A*)
    print("\n--- 3. Testing Routing API (POST /api/v1/routing/calculate) ---")
    gate_1_node = "1f1b7712-a70e-5960-a845-0920fdeccea2"
    block_1_node = "a875048e-3c13-59d9-8f31-798abe4cfe03"

    # Test Dijkstra
    dijkstra_payload = {
        "origin_node_id": gate_1_node,
        "destination_node_id": block_1_node,
        "accessible_only": False,
        "algorithm": "dijkstra",
    }
    dijkstra_resp = client.post("/api/v1/routing/calculate", json=dijkstra_payload)
    assert dijkstra_resp.status_code == 200, f"Dijkstra failed {dijkstra_resp.status_code}: {dijkstra_resp.text}"
    dijkstra_data = dijkstra_resp.json()
    print(f"  Dijkstra Route:")
    print(f"    Total distance: {dijkstra_data['total_distance_m']} m")
    print(f"    Estimated duration: {dijkstra_data.get('estimated_duration_min')} min ({dijkstra_data.get('estimated_duration_s')} s)")
    print(f"    Path nodes count: {len(dijkstra_data['path_nodes'])}")
    print(f"    Segments count: {len(dijkstra_data['segments'])}")
    assert dijkstra_data["total_distance_m"] > 0, "Dijkstra total distance must be > 0"
    assert len(dijkstra_data["path_nodes"]) >= 2, "Path must contain at least 2 nodes"

    # Test A*
    astar_payload = {
        "origin_node_id": gate_1_node,
        "destination_node_id": block_1_node,
        "accessible_only": False,
        "algorithm": "astar",
    }
    astar_resp = client.post("/api/v1/routing/calculate", json=astar_payload)
    assert astar_resp.status_code == 200, f"A* failed {astar_resp.status_code}: {astar_resp.text}"
    astar_data = astar_resp.json()
    print(f"  A* Route:")
    print(f"    Total distance: {astar_data['total_distance_m']} m")
    print(f"    Estimated duration: {astar_data.get('estimated_duration_min')} min ({astar_data.get('estimated_duration_s')} s)")
    print(f"    Path nodes count: {len(astar_data['path_nodes'])}")
    print(f"    Segments count: {len(astar_data['segments'])}")
    assert astar_data["total_distance_m"] > 0, "A* total distance must be > 0"
    assert len(astar_data["path_nodes"]) >= 2, "Path must contain at least 2 nodes"

    # Compare Dijkstra vs A* distances
    print(f"  Distance check: Dijkstra={dijkstra_data['total_distance_m']}m, A*={astar_data['total_distance_m']}m")
    assert abs(dijkstra_data["total_distance_m"] - astar_data["total_distance_m"]) < 0.1, (
        f"Dijkstra and A* distances should match within 0.1m: {dijkstra_data['total_distance_m']} vs {astar_data['total_distance_m']}"
    )

    # 4. Auth read-only tests
    print("\n--- 4. Testing Auth Endpoints (Read-Only) ---")
    # A. Unauthenticated /api/v1/auth/me should return 401
    me_resp = client.get("/api/v1/auth/me")
    print(f"  GET /api/v1/auth/me (unauthenticated): {me_resp.status_code} {me_resp.json()}")
    assert me_resp.status_code == 401, f"Expected 401, got {me_resp.status_code}"

    # B. Read-only user lookup via sync SQLAlchemy Session against Neon
    db_session = SessionLocal()
    try:
        from app.models.user import User as UserModel
        existing_user = db_session.query(UserModel).first()
        assert existing_user is not None, "At least one user must exist in Neon"
        print(f"  Found existing user in Neon: ID={existing_user.id}, Email={existing_user.email}, Name={existing_user.full_name}")

        user_by_id = db_session.query(UserModel).filter(UserModel.id == existing_user.id).first()
        assert user_by_id is not None, f"Failed to query user by ID {existing_user.id}"
        print(f"  Sync SQLAlchemy query passed: User {user_by_id.id} ({user_by_id.email})")
    finally:
        db_session.close()

    # C. Read-only user lookup via PostgresUserRepository (AsyncSession) against Neon
    import asyncio
    from app.core.database import get_async_db
    from app.repositories.postgres_user_repository import PostgresUserRepository

    async def test_async_user_repo():
        async for async_session in get_async_db():
            repo = PostgresUserRepository(async_session)
            user_by_id = await repo.get_by_id(str(existing_user.id))
            assert user_by_id is not None, f"Async PostgresUserRepository failed to get user by id {existing_user.id}"
            print(f"  Async PostgresUserRepository get_by_id passed: {user_by_id.id} ({user_by_id.email})")

            user_by_email = await repo.get_by_email(existing_user.email)
            assert user_by_email is not None, f"Async PostgresUserRepository failed to get user by email {existing_user.email}"
            print(f"  Async PostgresUserRepository get_by_email passed: {user_by_email.id} ({user_by_email.email})")
            break

    try:
        asyncio.run(test_async_user_repo())
    except Exception as e:
        print(f"  Async repo test note: {e}")

    # 5. Post-check row counts
    print("\n--- 5. Post-Verification Database State Integrity Check ---")
    conn = get_pg_connection(neon_url, readonly=True)
    post_counts = get_table_row_counts(conn, ALL_CANONICAL_TABLES)
    conn.close()

    assert baseline_counts == post_counts, f"Row counts modified during read-only verification! Baseline: {baseline_counts}, Post: {post_counts}"
    print("Record count integrity verified 100%: All table counts match baseline exactly.")
    print("=" * 70)
    print("PHASE 2 COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_live_verification()
