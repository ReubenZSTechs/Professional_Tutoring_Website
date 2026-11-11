"""The FastAPI application. All routes are served under /api.

Run locally with:  uvicorn agent.main:app --app-dir backend/src --reload --port 8000
On Vercel it is loaded by api/index.py.
"""

from core.config import get_settings
from core.logging import configure_logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agent.routes import chat, contact, health

configure_logging()
settings = get_settings()

app = FastAPI(
    title="Reuben Susanto Tutoring API",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(contact.router, prefix="/api", tags=["contact"])
