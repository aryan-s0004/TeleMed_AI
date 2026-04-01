import asyncio

from fastapi import APIRouter

from schemas import ProfileUpdateRequest
from services.patient_service import delete_account, find_user_by_unique_id, get_profile, update_profile

router = APIRouter(tags=["profile"])


@router.get("/profile/{user_id}")
async def read_profile(user_id: int) -> dict:
    return await asyncio.to_thread(get_profile, user_id)


@router.put("/profile/{user_id}")
async def save_profile(user_id: int, payload: ProfileUpdateRequest) -> dict:
    return await asyncio.to_thread(update_profile, user_id, payload)


@router.delete("/profile/{user_id}")
async def remove_account(user_id: int) -> dict:
    return await asyncio.to_thread(delete_account, user_id)


@router.get("/user/find/{unique_id}")
async def search_user(unique_id: str) -> dict:
    return await asyncio.to_thread(find_user_by_unique_id, unique_id)
