import pytest

from fastapi.testclient import TestClient
from src.app import app, activities

@pytest.fixture(autouse=True)
def reset_activities():
    # Arrange: Reset the in-memory activities data before each test
    # Reset to a minimal set for testing
    activities.clear()
    activities.update({
        "Basketball Team": {
            "description": "desc",
            "schedule": "sched",
            "max_participants": 10,
            "participants": []
        },
        "Chess Club": {
            "description": "desc",
            "schedule": "sched",
            "max_participants": 10,
            "participants": []
        }
    })

def test_get_activities():
    # Arrange
    client = TestClient(app)
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    # Should return a dict with our test activities
    data = response.json()
    assert set(data.keys()) == {"Basketball Team", "Chess Club"}
    assert data["Basketball Team"]["participants"] == []

def test_signup_activity():
    # Arrange
    client = TestClient(app)
    email = "alice@example.com"
    # Act
    response = client.post("/activities/Basketball Team/signup", params={"email": email})
    # Assert
    assert response.status_code == 200
    assert f"Signed up {email} for Basketball Team" in response.json()["message"]
    assert email in activities["Basketball Team"]["participants"]

def test_remove_participant():
    # Arrange
    client = TestClient(app)
    email = "bob@example.com"
    activities["Chess Club"]["participants"].append(email)
    # Act
    response = client.delete("/activities/Chess Club/participants", params={"email": email})
    # Assert
    assert response.status_code == 200
    assert f"Removed {email} from Chess Club" in response.json()["message"]
    assert email not in activities["Chess Club"]["participants"]
