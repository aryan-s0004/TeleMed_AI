from uuid import uuid4

from fastapi.testclient import TestClient

from main import fastapi_app

client = TestClient(fastapi_app)


def test_signup_otp_preview_and_login_flow():
    email = f"test-{uuid4().hex[:8]}@example.com"
    signup_payload = {
        "name": "Test Patient",
        "email": email,
        "password": "securepass123",
        "role": "patient",
    }

    send_response = client.post("/api/send-otp", json=signup_payload)
    assert send_response.status_code == 200
    send_body = send_response.json()
    assert send_body["preview_otp"]

    wrong_otp_response = client.post(
        "/api/verify-otp",
        json={"email": email, "code": "000000"},
    )
    assert wrong_otp_response.status_code == 400
    assert "Invalid OTP" in wrong_otp_response.json()["error"]

    verify_response = client.post(
        "/api/verify-otp",
        json={"email": email, "code": send_body["preview_otp"]},
    )
    assert verify_response.status_code == 200

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": signup_payload["password"]},
    )
    assert login_response.status_code == 200
    login_body = login_response.json()
    assert login_body["email"] == email
    assert login_body["role"] == "patient"
