import asyncio

from fastapi import APIRouter, Query

from schemas import AppointmentCreateRequest, AppointmentStatusRequest
from services.patient_service import (
    create_appointment,
    delete_appointment,
    list_appointments,
    update_appointment_status,
)

router = APIRouter(tags=["appointments"])


@router.get("/appointments")
async def get_appointments(user_id: int = Query(...), role: str = Query("patient")) -> list[dict]:
    return await asyncio.to_thread(list_appointments, user_id, role)


@router.post("/appointments")
async def book_appointment(payload: AppointmentCreateRequest) -> dict:
    return await asyncio.to_thread(create_appointment, payload)


@router.put("/appointments/{appointment_id}")
async def update_status(appointment_id: int, payload: AppointmentStatusRequest) -> dict:
    return await asyncio.to_thread(update_appointment_status, appointment_id, payload.status)


@router.delete("/appointments/{appointment_id}")
async def remove_appointment(appointment_id: int) -> dict:
    return await asyncio.to_thread(delete_appointment, appointment_id)
