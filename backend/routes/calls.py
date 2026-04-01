import asyncio

from fastapi import APIRouter, Query

from schemas import CallEndRequest, CallStartRequest
from services.patient_service import clear_calls, delete_call, end_call, get_call_history, start_call

router = APIRouter(tags=["calls"])


@router.post("/calls/start")
async def begin_call(payload: CallStartRequest) -> dict:
    return await asyncio.to_thread(start_call, payload)


@router.post("/calls/end")
async def finish_call(payload: CallEndRequest) -> dict:
    return await asyncio.to_thread(end_call, payload.room, payload.duration)


@router.get("/calls/{user_id}")
async def list_call_history(user_id: int, role: str = Query("patient")) -> list[dict]:
    return await asyncio.to_thread(get_call_history, user_id, role)


@router.delete("/calls/{call_id}")
async def remove_call(call_id: int) -> dict:
    return await asyncio.to_thread(delete_call, call_id)


@router.delete("/calls/clear/{user_id}")
async def clear_call_history(user_id: int, role: str = Query("patient")) -> dict:
    return await asyncio.to_thread(clear_calls, user_id, role)
