import asyncio

from fastapi import APIRouter

from schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    SendOtpRequest,
    VerifyOtpRequest,
)
from services.auth_service import (
    begin_password_reset,
    complete_signup,
    login_user,
    prepare_signup,
    resend_signup_otp,
    reset_password,
)

router = APIRouter(tags=["auth"])


def _response_from_delivery(result, message: str) -> MessageResponse:
    return MessageResponse(message=message, preview_otp=result.preview_otp)


@router.post("/send-otp", response_model=MessageResponse)
@router.post("/auth/signup", response_model=MessageResponse)
async def send_signup_otp(payload: SendOtpRequest) -> MessageResponse:
    result = await asyncio.to_thread(prepare_signup, payload)
    return _response_from_delivery(result, f"Verification code sent to {payload.email}.")


@router.post("/verify-otp", response_model=MessageResponse)
async def verify_signup_otp(payload: VerifyOtpRequest) -> MessageResponse:
    result = await asyncio.to_thread(complete_signup, payload.email, payload.code)
    return MessageResponse(**result)


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(payload: ForgotPasswordRequest) -> MessageResponse:
    result = await asyncio.to_thread(resend_signup_otp, payload.email)
    return _response_from_delivery(result, f"A new verification code was sent to {payload.email}.")


@router.post("/auth/login")
@router.post("/login")
async def login(payload: LoginRequest) -> dict:
    return await asyncio.to_thread(login_user, payload)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest) -> MessageResponse:
    result = await asyncio.to_thread(begin_password_reset, payload.email)
    return _response_from_delivery(result, f"Password reset code sent to {payload.email}.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_account_password(payload: ResetPasswordRequest) -> MessageResponse:
    result = await asyncio.to_thread(reset_password, payload.email, payload.code, payload.new_password)
    return MessageResponse(**result)
