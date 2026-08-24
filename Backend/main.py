# FastAPI application entry point

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import (
    auth,
    facilities,
    summary,
    triage,
)

from core.config import settings

from db.mongo import (
    close_mongo_connection,
    connect_to_mongo,
)


# APPLICATION LIFESPAN

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:
        Connect to MongoDB and initialize indexes.
    Shutdown:
        Close the MongoDB connection.
    """

    await connect_to_mongo()
    yield
    await close_mongo_connection()

# FASTAPI APPLICATION
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Decision-support and referral API for "
        "rural healthcare. "
        "This system is not a diagnostic tool and "
        "does not replace qualified medical judgment."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=[
        "*"
    ],
    allow_headers=[
        "*"
    ],
)

# API ROUTERS
app.include_router(
    auth.router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    triage.router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    facilities.router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    summary.router,
    prefix=settings.API_V1_PREFIX,
)


# HEALTH CHECK
@app.get(
    "/health",
    tags=["system"],
)
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.ENV,
    }