"""Cloudflare Turnstile verification (bot check).

The browser solves a Turnstile challenge and sends the resulting token;
we confirm it with Cloudflare before accepting a contact form or opening
a chat session. Outside production the published test secret is used, so
local development needs no Cloudflare account.
"""

import httpx
from core.config import Settings
from core.logging import get_logger

logger = get_logger(__name__)
VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


class TurnstileVerifier:
    def __init__(
        self, settings: Settings, *, transport: httpx.AsyncBaseTransport | None = None
    ) -> None:
        self.settings = settings
        self._transport = transport  # injected in tests

    @property
    def enabled(self) -> bool:
        return bool(self.settings.turnstile_secret)

    async def verify(self, token: str, remote_ip: str) -> bool:
        if not token:
            return False
        try:
            async with httpx.AsyncClient(timeout=8, transport=self._transport) as client:
                response = await client.post(
                    VERIFY_URL,
                    data={
                        "secret": self.settings.turnstile_secret,
                        "response": token,
                        "remoteip": remote_ip,
                    },
                )
            result = response.json()
        except Exception:  # noqa: BLE001 - treat a Cloudflare outage as a failed check
            logger.exception("Turnstile verification request failed")
            return False
        if not result.get("success"):
            logger.info("Turnstile rejected a token: %s", result.get("error-codes"))
            return False
        hostname = result.get("hostname") or ""
        if (
            not self.settings.turnstile_is_test
            and self.settings.allowed_hostnames
            and hostname not in self.settings.allowed_hostnames
        ):
            logger.warning("Turnstile token was solved on an unexpected host")
            return False
        return True
