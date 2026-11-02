# CampusWay — Testing & Quality Assurance Documentation

## 1. Testing Philosophy & Isolation Guarantees

CampusWay implements a rigorous, isolated testing architecture:
- **Zero Production/Cloud Impact**: Tests run against disposable in-memory SQLite instances or dedicated temporary databases. The Neon cloud database is never touched during automated testing.
- **Transactional Rollback**: Each test runs inside an isolated database session with foreign key integrity enabled.
- **Fast Execution**: The complete suite of 66 unit and integration tests executes in under 4 seconds.

---

## 2. Running Tests

### 2.1 Full Test Suite Execution
From the `backend/` directory with virtualenv active:

```powershell
python -m pytest
```

### 2.2 Verbose Output with Test Names
```powershell
python -m pytest -v
```

### 2.3 Running Specific Test Modules
```powershell
# Authentication & JWT security tests
python -m pytest tests/test_auth.py -v

# Graph construction and Dijkstra/A* routing tests
python -m pytest tests/test_routing.py -v

# Location hierarchy and search ranking tests
python -m pytest tests/test_locations.py -v

# Map import pipeline and GeoJSON staging tests
python -m pytest tests/test_import.py -v

# Visitor assistance and signpost QR tests
python -m pytest tests/test_assistance.py -v

# User favorites and problem reporting tests
python -m pytest tests/test_favorites_reports.py -v

# Reliability and edge case tests
python -m pytest tests/test_reliability_and_edge_cases.py -v

# Alembic migration integrity tests
python -m pytest tests/test_migrations.py -v
```

### 2.4 Coverage Reporting
```powershell
pip install pytest-cov
python -m pytest --cov=app --cov-report=term-missing
```

---

## 3. Test Suite Structure & Coverage Areas

| Test File | Total Tests | Key Verification Scenarios |
| :--- | :---: | :--- |
| `test_api_integration.py` | 10 | Administrative auth rejection, end-to-end location CRUD, parent-child validation, soft deactivation, search ranking. |
| `test_auth.py` | 7 | PBKDF2 password hashing uniqueness, JWT encoding/decoding, token expiry, Google SSO mock adapter, Phone OTP flow. |
| `test_locations.py` | 5 | Dedicated verification endpoint, duplicate sibling rejection, hierarchy cycle prevention, ancestor/children retrieval. |
| `test_routing.py` | 6 | Dijkstra vs A* pathfinding, cardinal bearing calculation, turn instructions, walking time formula, directed one-way edges. |
| `test_import.py` | 4 | Batch creation, GeoJSON FeatureCollection ingestion, duplicate detection against canonical locations, admin approve/reject review. |
| `test_assistance.py` | 3 | Visitor help request lifecycle, destination card topology checking, HMAC-SHA256 QR code generation, signature validation. |
| `test_favorites_reports.py`| 2 | Duplicate favorite prevention, user ownership enforcement, report resolution notes, reporter vs moderator permissions. |
| `test_reliability_and_edge_cases.py` | 12 | Expired token rejection, malformed headers, moderator vs admin RBAC, location pagination/filtering, edge weight validation, QR expiration. |
| `test_migrations.py` | 2 | Single-head Alembic migration consistency, model metadata registration. |
| `test_models.py` | 8 | ORM column constraints, relationships, cascades, timestamps. |
| `test_schemas.py` | 5 | Pydantic v2 input validation, coordinate ranges, required target reference logic. |
| `test_main.py` | 2 | Service root metadata and `/health` availability endpoint. |

**Current Suite Status**: **66 passed, 0 failures** (expanded from initial 27 baseline).
