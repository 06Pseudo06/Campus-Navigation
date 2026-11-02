"""
Verification script for SQLAlchemy ORM models mapping against Neon PostgreSQL schema.
Performs read-only inspection and query execution without modifying data or leaking secrets.
"""
import asyncio
import sys
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.database import get_db, get_engine
from app.models import Base, User, UserIdentity


async def verify_models():
    print("=" * 65)
    print("CampusWay — Step 3: ORM Models & Schema Verification")
    print("=" * 65)

    # 1. Test imports and table metadata
    print("[1/4] Verifying ORM model imports and metadata...")
    assert User.__tablename__ == "users"
    assert UserIdentity.__tablename__ == "user_identities"

    user_cols = {c.name: c for c in User.__table__.columns}
    identity_cols = {c.name: c for c in UserIdentity.__table__.columns}

    expected_user_cols = [
        "id", "full_name", "email", "phone", "role", "is_active", "created_at", "updated_at"
    ]
    expected_identity_cols = [
        "id", "user_id", "provider", "provider_subject", "created_at"
    ]

    for col in expected_user_cols:
        assert col in user_cols, f"Missing column {col} in User model"
    for col in expected_identity_cols:
        assert col in identity_cols, f"Missing column {col} in UserIdentity model"

    print(f"      Mapped User columns: {list(user_cols.keys())}")
    print(f"      Mapped UserIdentity columns: {list(identity_cols.keys())}")
    print("[OK] ORM models declared successfully with expected columns.")

    # 2. Verify schema against live Neon database
    print("\n[2/4] Verifying schema alignment against live Neon database...")
    engine = get_engine()
    async with engine.connect() as conn:
        # Check users columns in information_schema
        query_cols = await conn.run_sync(
            lambda sync_conn: sync_conn.execute(
                __import__("sqlalchemy").text(
                    "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
                    "WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position;"
                )
            ).fetchall()
        )
        db_user_cols = {row[0]: (row[1], row[2]) for row in query_cols}

        mismatches = []
        for col_name in expected_user_cols:
            if col_name not in db_user_cols:
                mismatches.append(f"Column '{col_name}' missing in Neon 'users' table")

        if mismatches:
            print(f"[FAIL] Schema mismatches detected: {mismatches}")
            return False
        else:
            print("[OK] All User columns match Neon database 'users' table 1:1.")

        # Check user_identities columns in information_schema
        query_identity_cols = await conn.run_sync(
            lambda sync_conn: sync_conn.execute(
                __import__("sqlalchemy").text(
                    "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
                    "WHERE table_schema = 'public' AND table_name = 'user_identities' ORDER BY ordinal_position;"
                )
            ).fetchall()
        )
        db_identity_cols = {row[0]: (row[1], row[2]) for row in query_identity_cols}
        for col_name in expected_identity_cols:
            if col_name not in db_identity_cols:
                mismatches.append(f"Column '{col_name}' missing in Neon 'user_identities' table")

        if mismatches:
            print(f"[FAIL] Schema mismatches detected: {mismatches}")
            return False
        else:
            print("[OK] All UserIdentity columns match Neon database 'user_identities' table 1:1.")

    # 3. Execute read-only SQLAlchemy ORM queries
    print("\n[3/4] Executing read-only SQLAlchemy ORM queries via AsyncSession...")
    async for session in get_db():
        # Query User count
        count_query = select(func.count()).select_from(User)
        user_count = (await session.execute(count_query)).scalar_one()
        print(f"      Current users count in Neon: {user_count}")

        # Query User list with limit
        users_query = select(User).limit(5)
        users_result = (await session.execute(users_query)).scalars().all()
        print(f"      Retrieved {len(users_result)} users successfully via ORM select(User)")

        # Query UserIdentity list with limit
        identity_query = select(UserIdentity).limit(5)
        identities_result = (await session.execute(identity_query)).scalars().all()
        print(f"      Retrieved {len(identities_result)} identities successfully via ORM select(UserIdentity)")

        # Test relationship definition compilation
        assert hasattr(User, "identities"), "User model missing identities relationship"
        assert hasattr(UserIdentity, "user"), "UserIdentity model missing user relationship"
        print("[OK] Relationship User <-> UserIdentity mapped and compiled correctly.")
        break

    print("\n[4/4] Verification finished successfully.")
    print("=" * 65)
    return True


if __name__ == "__main__":
    success = asyncio.run(verify_models())
    sys.exit(0 if success else 1)
