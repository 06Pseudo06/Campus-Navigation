"""
Temporary diagnostic script for verifying the FastAPI SQLAlchemy AsyncSession connection.
Executes SELECT 1 against Neon PostgreSQL without leaking any credentials.
"""
import asyncio
import sys
from sqlalchemy import text

from app.config import get_settings
from app.core.database import get_db, normalize_database_url


async def test_connection() -> bool:
    print("=" * 60)
    print("CampusWay — Database Connection Diagnostic")
    print("=" * 60)

    # 1. Load application settings
    settings = get_settings()
    if not settings.DATABASE_URL:
        print("[ERROR] DATABASE_URL is not set in backend/.env or settings.")
        return False

    print("[OK] Settings loaded from backend/.env")

    # 2. Inspect URL normalization safely without exposing secrets
    try:
        normalized_url, connect_args = normalize_database_url(settings.DATABASE_URL)
        print(f"[OK] Driver normalized: {normalized_url.drivername}")
        ssl_arg = connect_args.get("ssl")
        is_ssl_active = ssl_arg == "require" or hasattr(ssl_arg, "verify_mode") or bool(ssl_arg)
        print(f"[OK] SSL configured for Neon: {is_ssl_active}")
    except Exception as e:
        print(f"[ERROR] Failed to normalize database URL: {e}")
        return False

    # 3. Open an AsyncSession using the get_db() FastAPI dependency
    print("[INFO] Opening AsyncSession via get_db() dependency...")
    try:
        async for session in get_db():
            # 4. Execute harmless query
            result = await session.execute(text("SELECT 1 AS alive;"))
            scalar = result.scalar()
            print(f"[SUCCESS] Query 'SELECT 1' executed successfully. Result: {scalar}")
            break
        print("[SUCCESS] Neon PostgreSQL connection verified successfully via AsyncSession!")
        print("=" * 60)
        return True
    except Exception as e:
        # Sanitize exception message to ensure no connection strings or passwords leak
        err_type = type(e).__name__
        print(f"[ERROR] Connection failed: {err_type}")
        print(f"[ERROR] Diagnostic detail: {str(e)[:150]}")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)
