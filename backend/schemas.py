from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalized_text(value: str) -> str:
    return value.strip()


class MessageResponse(BaseModel):
    message: str
    preview_otp: str | None = None


class HealthResponse(BaseModel):
    status: str
    project: str
    environment: str
    mail_provider: str
    otp_debug_preview: bool


class SendOtpRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str
    password: str = Field(min_length=6, max_length=128)
    role: Literal["patient", "doctor"] = "patient"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = _normalized_text(value)
        if len(value) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = _normalized_text(value).lower()
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Please enter a valid email address.")
        return value


class VerifyOtpRequest(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = _normalized_text(value).lower()
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Please enter a valid email address.")
        return value

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        value = _normalized_text(value)
        if not value.isdigit() or len(value) != 6:
            raise ValueError("OTP must be a 6-digit code.")
        return value


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = _normalized_text(value).lower()
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Please enter a valid email address.")
        return value


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = _normalized_text(value).lower()
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Please enter a valid email address.")
        return value


class ResetPasswordRequest(VerifyOtpRequest):
    new_password: str = Field(min_length=6, max_length=128)


class AppointmentCreateRequest(BaseModel):
    patient_id: int
    doctor_id: int
    date: str = Field(min_length=10, max_length=10)
    time: str = Field(min_length=4, max_length=5)
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("date", "time", "reason")
    @classmethod
    def strip_values(cls, value: str) -> str:
        return _normalized_text(value)


class AppointmentStatusRequest(BaseModel):
    status: Literal["pending", "confirmed", "cancelled"]


class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    phone: str = Field(default="", max_length=32)
    age: str = Field(default="", max_length=8)
    weight: str = Field(default="", max_length=16)
    height: str = Field(default="", max_length=16)
    blood_group: str = Field(default="", max_length=8)
    sex: str = Field(default="", max_length=16)

    @field_validator("name", "phone", "age", "weight", "height", "blood_group", "sex")
    @classmethod
    def strip_values(cls, value: str) -> str:
        return _normalized_text(value)


class RecordCreateRequest(BaseModel):
    patient_id: int | None = None
    unique_id: str | None = None
    doctor_id: int
    diagnosis: str = Field(min_length=2, max_length=200)
    prescription: str = Field(default="", max_length=2000)
    notes: str = Field(default="", max_length=2000)

    @field_validator("unique_id")
    @classmethod
    def normalize_unique_id(cls, value: str | None) -> str | None:
        return _normalized_text(value) if value else value

    @field_validator("diagnosis", "prescription", "notes")
    @classmethod
    def strip_values(cls, value: str) -> str:
        return _normalized_text(value)


class CallStartRequest(BaseModel):
    room: str = Field(min_length=3, max_length=120)
    patient_id: int | None = None
    doctor_id: int | None = None

    @field_validator("room")
    @classmethod
    def normalize_room(cls, value: str) -> str:
        return _normalized_text(value)


class CallEndRequest(BaseModel):
    room: str = Field(min_length=3, max_length=120)
    duration: str = Field(default="", max_length=64)

    @field_validator("room", "duration")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return _normalized_text(value)


class PredictionRequest(BaseModel):
    symptoms: list[str]

    @field_validator("symptoms")
    @classmethod
    def validate_symptoms(cls, value: list[str]) -> list[str]:
        normalized = [_normalized_text(item).lower() for item in value if _normalized_text(item)]
        if not normalized:
            raise ValueError("Please select at least one symptom.")
        return normalized
