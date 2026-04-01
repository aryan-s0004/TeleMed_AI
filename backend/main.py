from __future__ import annotations

from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import get_settings
from db import init_db
from routes.appointments import router as appointments_router
from routes.auth import router as auth_router
from routes.calls import router as calls_router
from routes.doctors import router as doctors_router
from routes.health import router as health_router
from routes.prediction import router as prediction_router
from routes.profile import router as profile_router
from routes.records import router as records_router
from utils.errors import ServiceError

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


fastapi_app = FastAPI(
    title="TeleMed_AI Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@fastapi_app.exception_handler(ServiceError)
async def service_error_handler(_, exc: ServiceError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


routers = [
    health_router,
    auth_router,
    appointments_router,
    doctors_router,
    profile_router,
    records_router,
    calls_router,
    prediction_router,
]

for router in routers:
    fastapi_app.include_router(router)
    fastapi_app.include_router(router, prefix="/api")


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.socket_cors_origins,
)


@sio.on("join-room")
async def join_room(sid, data):
    room = data["room"]
    await sio.enter_room(sid, room)
    await sio.emit("user-joined", {"userId": sid}, room=room, skip_sid=sid)


@sio.on("offer")
async def offer(sid, data):
    await sio.emit("offer", data, room=data["room"], skip_sid=sid)


@sio.on("answer")
async def answer(sid, data):
    await sio.emit("answer", data, room=data["room"], skip_sid=sid)


@sio.on("ice-candidate")
async def ice_candidate(sid, data):
    await sio.emit("ice-candidate", data, room=data["room"], skip_sid=sid)


@sio.on("leave-room")
async def leave_room(sid, data):
    await sio.leave_room(sid, data["room"])
    await sio.emit("user-left", {}, room=data["room"], skip_sid=sid)


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
