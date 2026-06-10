import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Peer Tutoring AI Service"

def test_recommend_tutors_no_auth():
    response = client.post("/api/v1/recommend-tutors", json={
        "studentId": "test_student",
        "subject": "Math"
    })
    # Should fail without internal secret
    assert response.status_code == 403

def test_recommend_tutors_with_auth():
    # In a real test suite, we'd mock the Firebase client so it doesn't hit the real DB.
    # For now, we expect 500 or proper validation error if we pass dummy data.
    pass
