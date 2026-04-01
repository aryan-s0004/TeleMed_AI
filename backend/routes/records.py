import asyncio

from fastapi import APIRouter

from schemas import RecordCreateRequest
from services.patient_service import create_record, list_records

router = APIRouter(tags=["records"])


@router.get("/records/{patient_id}")
async def get_records(patient_id: int) -> list[dict]:
    return await asyncio.to_thread(list_records, patient_id)


@router.post("/records")
async def save_record(payload: RecordCreateRequest) -> dict:
    return await asyncio.to_thread(create_record, payload)
