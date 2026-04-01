from __future__ import annotations

from db import fetch_one, generate_unique_user_id, run_in_transaction
from services.email_service import EmailSendResult, send_otp_email
from services.otp_service import otp_store
from utils.errors import ConflictError, NotFoundError, ServiceError, UnauthorizedError
from utils.security import hash_password, verify_password


def _serialize_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "unique_id": user["unique_id"],
    }


def prepare_signup(payload) -> EmailSendResult:
    existing = fetch_one("SELECT id FROM users WHERE email = ?", (payload.email,))
    if existing:
        raise ConflictError("Email already registered.")

    entry = otp_store.create(
        payload.email,
        "signup",
        {
            "name": payload.name,
            "email": payload.email,
            "password": payload.password,
            "role": payload.role,
        },
    )
    return send_otp_email(payload.email, payload.name, entry.code, "signup")


def resend_signup_otp(email: str) -> EmailSendResult:
    entry = otp_store.refresh(email, "signup")
    name = entry.payload.get("name", "User")
    return send_otp_email(email, name, entry.code, "signup")


def complete_signup(email: str, code: str) -> dict:
    payload = otp_store.consume(email, "signup", code)

    def operation(connection):
        existing = connection.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise ConflictError("Email already registered.")

        connection.execute(
            """
            INSERT INTO users (name, email, password, role, unique_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload["name"],
                payload["email"],
                hash_password(payload["password"]),
                payload.get("role", "patient"),
                generate_unique_user_id(connection),
            ),
        )
        return {"message": "Registration complete. You can now sign in."}

    return run_in_transaction(operation)


def login_user(payload) -> dict:
    user = fetch_one("SELECT * FROM users WHERE email = ?", (payload.email,))
    if not user:
        raise UnauthorizedError("Invalid email or password.")

    is_valid, is_legacy_hash = verify_password(payload.password, user["password"])
    if not is_valid:
        raise UnauthorizedError("Invalid email or password.")

    if is_legacy_hash:
        run_in_transaction(
            lambda connection: connection.execute(
                "UPDATE users SET password = ? WHERE id = ?",
                (hash_password(payload.password), user["id"]),
            )
        )

    return _serialize_user(user)


def begin_password_reset(email: str) -> EmailSendResult:
    user = fetch_one("SELECT id, name, email FROM users WHERE email = ?", (email,))
    if not user:
        raise NotFoundError("No account found with this email address.")

    entry = otp_store.create(
        email,
        "password-reset",
        {"user_id": user["id"], "email": user["email"], "name": user["name"]},
    )
    return send_otp_email(email, user["name"], entry.code, "password-reset")


def reset_password(email: str, code: str, new_password: str) -> dict:
    payload = otp_store.consume(email, "password-reset", code)

    def operation(connection):
        cursor = connection.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            (hash_password(new_password), payload["user_id"]),
        )
        if cursor.rowcount == 0:
            raise ServiceError("Unable to reset the password for this account.", 500)
        return {"message": "Password reset successful. You can now sign in."}

    return run_in_transaction(operation)
