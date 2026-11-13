"""Record blocked or suspicious chat activity for later review.

Rows go to the Supabase `security_events` table: a hashed IP, a category
and a short excerpt. Recording never raises; a logging failure must not
break a visitor's request.
"""

from core.logging import get_logger

logger = get_logger(__name__)

EXCERPT_CHARS = 200


class SecurityEvents:
    def __init__(self, supabase) -> None:  # noqa: ANN001 - duck-typed client
        self.supabase = supabase

    async def record(
        self, category: str, ip_hash: str, excerpt: str = "", detail: dict | None = None
    ) -> None:
        logger.warning("security event: %s", category)
        if not getattr(self.supabase, "ready", False):
            return
        try:
            await self.supabase.insert_many(
                "security_events",
                [
                    {
                        "category": category,
                        "ip_hash": ip_hash,
                        "excerpt": excerpt[:EXCERPT_CHARS],
                        "detail": detail or {},
                    }
                ],
            )
        except Exception:  # noqa: BLE001
            logger.exception("Could not record security event")
