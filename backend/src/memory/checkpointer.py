"""Optional chat log.

The site is serverless, so conversation memory lives in the visitor's
browser and is sent with each request. When `CHAT_LOGGING=true`, each
question and answer is also saved to the Supabase `chat_messages` table
so you can review what parents and students ask. Logging never blocks or
breaks a reply: failures are logged and ignored.
"""

from core.config import Settings, get_settings
from core.logging import get_logger
from services.supabase import SupabaseClient

logger = get_logger(__name__)


class ChatLog:
    def __init__(self, supabase: SupabaseClient, settings: Settings | None = None) -> None:
        self.supabase = supabase
        self.settings = settings or get_settings()

    @property
    def enabled(self) -> bool:
        return self.settings.chat_logging and self.supabase.ready

    async def save_turn(
        self, *, session_id: str, question: str, rewritten_query: str, answer: str
    ) -> None:
        if not self.enabled or not session_id:
            return
        try:
            await self.supabase.insert_many(
                "chat_messages",
                [
                    {
                        "session_id": session_id,
                        "role": "user",
                        "content": question,
                        "rewritten_query": rewritten_query,
                    },
                    {
                        "session_id": session_id,
                        "role": "assistant",
                        "content": answer,
                        "rewritten_query": None,
                    },
                ],
            )
        except Exception:  # noqa: BLE001 - logging must never break a reply
            logger.exception("Could not save chat turn")
