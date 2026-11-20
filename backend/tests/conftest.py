"""Pytest configuration and test database fixtures."""

import os
os.environ["ENVIRONMENT"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
from app.core.database import Base
from app.main import app
from app.services.user_store import (
    get_db_optional,
    get_in_memory_user_repository,
    get_user_repository,
)

# In-memory SQLite engine with StaticPool for test isolation
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all database tables for the test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    """Provide a clean transactional database session per test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    """Provide a TestClient with overridden get_db and user_repo dependencies."""
    def override_get_db():
        yield db

    async def override_get_db_optional():
        yield None

    repo = get_in_memory_user_repository()
    repo.clear()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_optional] = override_get_db_optional
    app.dependency_overrides[get_user_repository] = lambda: repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    repo.clear()
