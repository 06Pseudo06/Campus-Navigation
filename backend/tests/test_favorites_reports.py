"""Unit and integration tests for user favorites and map issue reporting with ownership enforcement."""

import uuid
import pytest
from app.models.location import Location
from app.models.user import User

ADMIN_HEADERS = {"X-Admin-Key": "campusway-admin-dev-secret"}


def test_favorites_full_lifecycle_and_mine_endpoint(client, db):
    """Verify favorites bookmarking, eager location loading, /mine endpoint, and duplicate idempotence."""
    u = User(full_name="Bookmarker", email="bookmark@campus.edu")
    db.add(u)
    db.commit()

    loc = client.post(
        "/api/v1/locations/",
        json={"name": "Auditorium Hub", "location_type": "building"},
        headers=ADMIN_HEADERS,
    ).json()

    u_headers = {"X-User-ID": str(u.id)}

    # 1. Add favorite
    res_add = client.post(
        "/api/v1/favorites/",
        json={"user_id": str(u.id), "location_id": loc["id"]},
        headers=u_headers,
    )
    assert res_add.status_code == 201

    # 2. Duplicate add returns existing bookmark idempotently
    res_dup = client.post(
        "/api/v1/favorites/",
        json={"user_id": str(u.id), "location_id": loc["id"]},
        headers=u_headers,
    )
    assert res_dup.status_code == 201

    # 3. Retrieve favorites via /favorites/mine
    res_mine = client.get("/api/v1/favorites/mine", headers=u_headers)
    assert res_mine.status_code == 200
    favs = res_mine.json()
    assert len(favs) == 1
    assert favs[0]["location_id"] == loc["id"]
    # Verify location relationship is loaded
    assert favs[0]["location"]["name"] == "Auditorium Hub"

    # 4. Remove favorite
    res_del = client.delete(f"/api/v1/favorites/{u.id}/{loc['id']}", headers=u_headers)
    assert res_del.status_code == 204

    # Now empty
    res_empty = client.get("/api/v1/favorites/mine", headers=u_headers)
    assert len(res_empty.json()) == 0


def test_reports_resolution_notes_and_ownership_protection(client, db):
    """Verify reports support resolution notes, reporter-scoping, and cross-user modification protection."""
    u_reporter = User(full_name="Student Reporter", email="reporter@campus.edu")
    u_other = User(full_name="Other Student", email="other@campus.edu")
    db.add_all([u_reporter, u_other])
    db.commit()

    loc = client.post(
        "/api/v1/locations/",
        json={"name": "Campus Clinic", "location_type": "facility"},
        headers=ADMIN_HEADERS,
    ).json()

    reporter_headers = {"X-User-ID": str(u_reporter.id)}
    other_headers = {"X-User-ID": str(u_other.id)}

    # 1. Submit report as authenticated user
    res_sub = client.post(
        "/api/v1/reports/",
        json={
            "location_id": loc["id"],
            "report_type": "wrong_pin",
            "description": "Clinic entrance moved 20m south.",
        },
        headers=reporter_headers,
    )
    assert res_sub.status_code == 201
    rep = res_sub.json()
    rep_id = rep["id"]
    assert rep["reporter_id"] == str(u_reporter.id)

    # 2. Reporter views own reports via /my-reports
    res_my = client.get("/api/v1/reports/my-reports", headers=reporter_headers)
    assert res_my.status_code == 200
    assert any(r["id"] == rep_id for r in res_my.json())

    # Other student's /my-reports does NOT contain it
    res_other_my = client.get("/api/v1/reports/my-reports", headers=other_headers)
    assert not any(r["id"] == rep_id for r in res_other_my.json())

    # 3. Other student cannot modify the report (403 Forbidden)
    res_cross_patch = client.patch(
        f"/api/v1/reports/{rep_id}",
        json={"description": "Hacked description"},
        headers=other_headers,
    )
    assert res_cross_patch.status_code == 403

    # 4. Other student cannot view single report detail (403 Forbidden)
    res_cross_get = client.get(f"/api/v1/reports/{rep_id}", headers=other_headers)
    assert res_cross_get.status_code == 403

    # 5. Reporter CAN view own report detail
    res_own_get = client.get(f"/api/v1/reports/{rep_id}", headers=reporter_headers)
    assert res_own_get.status_code == 200

    # 6. Admin resolves report with resolution notes
    res_admin_resolve = client.patch(
        f"/api/v1/reports/{rep_id}",
        json={"status": "resolved", "resolution_notes": "Map pin adjusted according to ground GPS survey."},
        headers=ADMIN_HEADERS,
    )
    assert res_admin_resolve.status_code == 200
    res_data = res_admin_resolve.json()
    assert res_data["status"] == "resolved"
    assert res_data["resolution_notes"] == "Map pin adjusted according to ground GPS survey."
    assert res_data["resolved_at"] is not None
