"""Application settings.

Every tunable value lives here and is read from environment variables
(or the repo-root `.env` file in local development). Nothing else in the
backend reads `os.environ` directly, so this is the one place to look
when you want to change a model, a limit, or a credential.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/src/core/config.py -> repo root is three levels above `src`.
SRC_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SRC_DIR.parents[1]
PROMPTS_DIR = SRC_DIR / "prompts"
SCHEMAS_DIR = SRC_DIR / "schemas"
KNOWLEDGE_DIR = REPO_ROOT / "knowledge"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Gemini -----------------------------------------------------------
    gemini_api_key: str = ""
    gemini_chat_model: str = "gemini-3.6-flash"  # answering agent
    gemini_rewrite_model: str = "gemini-3.5-flash-lite"  # prompt_rewriter agent
    gemini_embed_model: str = "gemini-embedding-2"
    embed_dimensions: int = 768  # must match vector(768) in the migration

    # --- Supabase ---------------------------------------------------------
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # --- Contact form / email ---------------------------------------------
    resend_api_key: str = ""
    contact_to_email: str = ""
    contact_from_email: str = "Tutoring Website <onboarding@resend.dev>"

    # --- HTTP -------------------------------------------------------------
    allowed_origins: str = "*"  # comma-separated list, or "*"
    rate_limit_chat_per_min: int = 12
    rate_limit_contact_per_hour: int = 5

    # --- Chat behaviour ---------------------------------------------------
    chat_logging: bool = False  # store chat turns in Supabase `chat_messages`
    history_max_turns: int = 12  # older turns are summarised
    max_message_chars: int = 1500
    rag_top_k: int = 6
    rag_min_similarity: float = 0.35

    log_level: str = "INFO"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def gemini_ready(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def supabase_ready(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def email_ready(self) -> bool:
        return bool(self.resend_api_key and self.contact_to_email)


@lru_cache
def get_settings() -> Settings:
    return Settings()
