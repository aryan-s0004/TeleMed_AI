from fastapi import APIRouter

from core.config import get_settings
from schemas import HealthResponse

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        project=settings.project_name,
        environment=settings.environment,
        mail_provider=settings.mail_provider,
        otp_debug_preview=settings.otp_debug_preview,
    )
