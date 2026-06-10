"""
Peer Tutoring Marketplace — AI Service
FastAPI application for tutor matching, recommendations, and AI-powered features.
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import sentry_sdk
from fastapi import FastAPI, status, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
import structlog

from config import settings
from models.model_store import ModelStore
from routers import recommendations, training

logger = structlog.get_logger()

# ─── Sentry Initialization ────────────────────────────────────────

def before_send(event, hint):
    """Scrub sensitive data from Sentry events."""
    if 'request' in event and 'headers' in event['request']:
        headers = event['request']['headers']
        if 'authorization' in headers:
            headers['authorization'] = '[Filtered]'
        if 'x-internal-secret' in headers:
            headers['x-internal-secret'] = '[Filtered]'
    return event

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=0.1 if not settings.debug else 1.0,
        environment="development" if settings.debug else "production",
        before_send=before_send,
    )

# ─── ML Model Loading ─────────────────────────────────────────────

model_store = ModelStore()

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown events."""
    logger.info("service_startup", app_name=settings.app_name, debug=settings.debug)
    
    # Load ML models on startup
    try:
        model_store.load_model(settings.model_path)
        logger.info("model_loaded", version=model_store.version)
    except Exception as e:
        logger.warning("model_load_failed", error=str(e), path=settings.model_path)
        
    yield
    logger.info("service_shutdown", app_name=settings.app_name)


app = FastAPI(
    title="Peer Tutoring AI Service",
    description="AI-powered tutor matching, recommendations, and content analysis",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Authentication ───────────────────────────────────────────────

api_key_header = APIKeyHeader(name="X-Internal-Secret", auto_error=False)

async def verify_internal_secret(api_key: str = Security(api_key_header)):
    """Verify the internal secret header."""
    if api_key != settings.internal_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    return api_key

# ─── Routers ──────────────────────────────────────────────────────

app.include_router(
    recommendations.router,
    prefix="/api/v1",
    dependencies=[Depends(verify_internal_secret)],
)

app.include_router(
    training.router,
    prefix="/api/v1",
    dependencies=[Depends(verify_internal_secret)],
)

# ─── Health & Metrics ─────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool
    model_version: str | None

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """Health check endpoint for load balancers and monitoring."""
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version="0.1.0",
        model_loaded=model_store.is_loaded,
        model_version=model_store.version,
    )

# ─── Error Handlers ───────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(_request: object, exc: Exception) -> JSONResponse:
    """Global exception handler for unhandled errors."""
    logger.error("unhandled_exception", error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred" if not settings.debug else str(exc),
                "details": None,
            },
            "data": None,
            "meta": None,
        },
    )
