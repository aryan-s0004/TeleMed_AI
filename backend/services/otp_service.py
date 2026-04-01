from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any

from core.config import get_settings
from utils.errors import ServiceError
from utils.ids import generate_otp

settings = get_settings()


@dataclass
class OTPEntry:
    code: str
    purpose: str
    payload: dict[str, Any]
    expires_at: datetime


class OTPStore:
    def __init__(self) -> None:
        self._entries: dict[tuple[str, str], OTPEntry] = {}
        self._lock = Lock()

    def _cleanup(self) -> None:
        now = datetime.now(timezone.utc)
        expired = [key for key, entry in self._entries.items() if entry.expires_at <= now]
        for key in expired:
            self._entries.pop(key, None)

    def create(self, email: str, purpose: str, payload: dict[str, Any]) -> OTPEntry:
        with self._lock:
            self._cleanup()
            entry = OTPEntry(
                code=generate_otp(),
                purpose=purpose,
                payload=payload,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes),
            )
            self._entries[(email, purpose)] = entry
            return entry

    def refresh(self, email: str, purpose: str) -> OTPEntry:
        with self._lock:
            self._cleanup()
            entry = self._entries.get((email, purpose))
            if not entry:
                raise ServiceError("OTP session expired. Please start again.", 400)
            entry.code = generate_otp()
            entry.expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes)
            return entry

    def consume(self, email: str, purpose: str, code: str) -> dict[str, Any]:
        with self._lock:
            self._cleanup()
            entry = self._entries.get((email, purpose))
            if not entry:
                raise ServiceError("No active OTP found. Please request a new code.", 400)
            if datetime.now(timezone.utc) > entry.expires_at:
                self._entries.pop((email, purpose), None)
                raise ServiceError("OTP expired. Please request a new code.", 400)
            if entry.code != code:
                raise ServiceError("Invalid OTP. Please try again.", 400)
            self._entries.pop((email, purpose), None)
            return entry.payload


otp_store = OTPStore()
