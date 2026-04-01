from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent

load_dotenv(PROJECT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env", override=True)


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _as_bool(value: str, default: bool = False) -> bool:
    if not value:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    project_name: str = os.getenv("PROJECT_NAME", "TeleMed_AI")
    environment: str = os.getenv("ENVIRONMENT", "development")
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000").strip()
    sendgrid_api_key: str = os.getenv("SENDGRID_API_KEY", "").strip()
    mail_username: str = os.getenv("MAIL_USERNAME", "").strip()
    mail_password: str = os.getenv("MAIL_PASSWORD", "").strip()
    mail_from_email_raw: str = os.getenv("MAIL_FROM_EMAIL", "").strip()
    otp_expiry_minutes: int = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
    otp_debug_preview: bool = _as_bool(os.getenv("OTP_DEBUG_PREVIEW", "false"))
    database_path: Path = BACKEND_DIR / "database" / "telemedicine.db"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def allowed_origins(self) -> list[str]:
        csv_origins = _split_csv(os.getenv("CORS_ORIGINS", ""))
        origins = [
            self.frontend_url,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ] + csv_origins
        unique_origins = []
        for origin in origins:
            if not origin or origin in unique_origins:
                continue
            if origin == "*":
                return ["*"]
            unique_origins.append(origin.rstrip("/"))
        return unique_origins

    @property
    def socket_cors_origins(self) -> str | list[str]:
        origins = self.allowed_origins
        return "*" if origins == ["*"] else origins

    @property
    def mail_from_email(self) -> str:
        return self.mail_from_email_raw or self.mail_username or "noreply@telemed-ai.local"

    @property
    def mail_provider(self) -> str:
        if self.sendgrid_api_key:
            return "sendgrid"
        if self.mail_username and self.mail_password:
            return "smtp"
        return "preview" if self.otp_debug_preview and not self.is_production else "unconfigured"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
