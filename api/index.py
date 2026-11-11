"""Vercel entry point for the Python backend.

Vercel serves this file as a serverless function for every /api/* path
(see the rewrite in next.config.ts). The real application lives in
backend/src; this file only puts it on the import path.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend" / "src"))

from agent.main import app  # noqa: E402

__all__ = ["app"]
