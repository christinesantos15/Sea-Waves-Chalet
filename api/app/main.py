from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.routers.inventory import router as inventory_router
from app.routers.availability import router as availability_router
from app.routers.reservations import router as reservations_router

from app.routers.operator_reservations import (
    router as operator_reservations_router,
)

from app.routers.operator_payments import (
    router as operator_payments_router,
)

from app.routers.operator_daily_operations import (
    router as operator_daily_operations_router,
)

from app.routers.staff_operations import (
    router as staff_operations_router,
)

app = FastAPI(
    title=settings.app_name,
    version="0.3.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(inventory_router)
app.include_router(availability_router)
app.include_router(reservations_router)
app.include_router(operator_reservations_router)
app.include_router(operator_payments_router)
app.include_router(operator_daily_operations_router)
app.include_router(staff_operations_router)

@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected",
    }