"""Shared test fixtures for CampusWay backend test suite."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.api.dependencies import get_db
from app.models.base import Base

# Use an in-memory SQLite database for tests
SQLITE_TEST_URL = "sqlite:///./test_campusway.db"
test_engine = create_engine(SQLITE_TEST_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a clean database session for direct ORM testing."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """Provide a FastAPI TestClient with database dependency override."""
    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
