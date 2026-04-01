import asyncio

from fastapi import APIRouter

from services.patient_service import list_doctors

router = APIRouter(tags=["doctors"])


@router.get("/doctors")
async def get_doctors() -> list[dict]:
    return await asyncio.to_thread(list_doctors)
