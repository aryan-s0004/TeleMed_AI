from fastapi.testclient import TestClient

from main import fastapi_app

client = TestClient(fastapi_app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["project"] == "TeleMed_AI"


def test_prediction_endpoint():
    response = client.post("/api/predict", json={"symptoms": ["fever", "cough"]})
    assert response.status_code == 200
    body = response.json()
    assert "disease" in body or "error" in body
