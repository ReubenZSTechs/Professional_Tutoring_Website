"""Vercel entry point for the backend service.

vercel.json declares this directory (`backend/`) as the "backend" service
with the FastAPI framework, and every public /api/* request is routed
here with its full path (/api/chat, /api/contact, ...), which matches the
routes in agent/main.py.

The application code lives in src/; this file only puts it on the import
path and exposes the FastAPI instance as `app`, the name Vercel looks for.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from agent.main import app  # noqa: E402

__all__ = ["app"]
