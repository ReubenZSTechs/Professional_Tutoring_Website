"""The FastAPI application. All routes are served under /api.

Run locally with:  uvicorn agent.main:app --app-dir backend/src --reload --port 8000
On Vercel it is loaded by api/index.py.
"""

import uuid

from core.config import get_settings
from core.logging import configure_logging, get_logger
from core.security import SecurityMiddleware
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from agent.routes import chat, contact, health

configure_logging()
logger = get_logger(__name__)
settings = get_settings()

# In production, refuse to start with missing secrets rather than run exposed.
problems = settings.production_problems()
if problems:
    raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))

app = FastAPI(
    title="Reuben Susanto Tutoring API",
    # Interactive docs are a development convenience only.
    docs_url=None if settings.is_production else "/api/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/api/openapi.json",
)

# Order matters: the outermost middleware runs first.
app.add_middleware(SecurityMiddleware, settings=settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=600,
)
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(contact.router, prefix="/api", tags=["contact"])


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:
    """Never leak stack traces; log with an id the visitor can quote."""
    request_id = uuid.uuid4().hex[:12]
    logger.exception("Unhandled error %s on %s %s", request_id, request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again.", "request_id": request_id},
    )
