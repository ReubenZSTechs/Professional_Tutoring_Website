"""Application settings.

Every tunable value lives here and is read from environment variables
(or the repo-root `.env` file in local development). Nothing else in the
backend reads `os.environ` directly, so this is the one place to look
when you want to change a model, a limit, or a credential.
"""

from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/src/core/config.py -> repo root is three levels above `src`.
SRC_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SRC_DIR.parents[1]
PROMPTS_DIR = SRC_DIR / "prompts"
SCHEMAS_DIR = SRC_DIR / "schemas"
KNOWLEDGE_DIR = REPO_ROOT / "knowledge"

# Cloudflare's published Turnstile test keys: the widget always passes.
# Used automatically outside production so local development needs no
# Cloudflare setup. See https://developers.cloudflare.com/turnstile/troubleshooting/testing/
TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA"
TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA"

LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Where we are running ----------------------------------------------
    # "production" switches on fail-fast secret checks, hides API docs and
    # makes error responses generic. Anything else counts as development.
    environment: str = "development"

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

    # --- Site and browser security ----------------------------------------
    # Public address of the site (also used by the frontend).
    next_public_site_url: str = ""
    # Comma-separated origins allowed to call the API. Empty = the site URL,
    # plus localhost in development. "*" is deliberately not supported.
    allowed_origins: str = ""
    # Cloudflare Turnstile (bot check). Test keys are used outside production.
    next_public_turnstile_site_key: str = ""
    turnstile_secret_key: str = ""
    # Secret salt for hashing visitor IP addresses before storing them.
    ip_hash_salt: str = ""
    # Secret for signing chat session tokens and chat transcripts.
    chat_signing_secret: str = ""
    chat_session_ttl_seconds: int = 1800
    max_body_bytes: int = 32_768

    # --- Rate limits ------------------------------------------------------
    rate_limit_chat_per_min: int = 12
    rate_limit_chat_per_day: int = 150
    rate_limit_contact_per_hour: int = 5
    # Site-wide cap on chat requests per day: a circuit breaker on the Gemini bill.
    daily_chat_limit: int = 2000

    # --- Chat behaviour ---------------------------------------------------
    chat_logging: bool = False  # store chat turns in Supabase `chat_messages`
    history_max_turns: int = 12  # older turns are summarised
    history_window: int = 20  # messages the browser sends back (signed)
    max_message_chars: int = 800
    answer_max_output_tokens: int = 600
    rag_top_k: int = 6
    rag_min_similarity: float = 0.35
    injection_block_score: int = 3

    log_level: str = "INFO"

    # --- Derived values ---------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() == "production"

    @property
    def cors_origins(self) -> list[str]:
        """Origins allowed to call the API. Never a wildcard."""
        origins = [o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()]
        origins = [o for o in origins if o != "*"]
        if not origins and self.next_public_site_url:
            origins = [self.next_public_site_url.rstrip("/")]
        if not self.is_production:
            origins = origins + [o for o in LOCAL_ORIGINS if o not in origins]
        return origins

    @property
    def allowed_hostnames(self) -> set[str]:
        return {urlparse(o).hostname or "" for o in self.cors_origins} - {""}

    @property
    def turnstile_secret(self) -> str:
        return self.turnstile_secret_key if self.is_production else TURNSTILE_TEST_SECRET_KEY

    @property
    def turnstile_is_test(self) -> bool:
        return self.turnstile_secret == TURNSTILE_TEST_SECRET_KEY

    @property
    def gemini_ready(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def supabase_ready(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def email_ready(self) -> bool:
        return bool(self.resend_api_key and self.contact_to_email)

    def production_problems(self) -> list[str]:
        """Settings that must be present before the site is exposed to the internet."""
        if not self.is_production:
            return []
        required = {
            "GEMINI_API_KEY": self.gemini_api_key,
            "SUPABASE_URL": self.supabase_url,
            "SUPABASE_SERVICE_ROLE_KEY": self.supabase_service_role_key,
            "TURNSTILE_SECRET_KEY": self.turnstile_secret_key,
            "IP_HASH_SALT": self.ip_hash_salt,
            "CHAT_SIGNING_SECRET": self.chat_signing_secret,
            "NEXT_PUBLIC_SITE_URL": self.next_public_site_url,
        }
        problems = [f"{name} is not set" for name, value in required.items() if not value]
        if len(self.chat_signing_secret) < 32:
            problems.append("CHAT_SIGNING_SECRET should be at least 32 characters")
        if len(self.ip_hash_salt) < 16:
            problems.append("IP_HASH_SALT should be at least 16 characters")
        if self.allowed_origins.strip() == "*":
            problems.append("ALLOWED_ORIGINS must list the site origin, not *")
        return problems


@lru_cache
def get_settings() -> Settings:
    return Settings()
