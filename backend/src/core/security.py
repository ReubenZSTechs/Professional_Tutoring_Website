"""Request-level protections for the API, as one ASGI middleware.

* Writes (POST and friends) must come from an allowed Origin and be JSON.
  Together with the CORS settings this blocks cross-site requests.
* Bodies larger than `max_body_bytes` are refused with 413.
* Every response gets `Cache-Control: no-store` and `nosniff`.
"""

import json

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from core.config import Settings

WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def _plain_response(status: int, detail: str) -> tuple[bytes, list[tuple[bytes, bytes]]]:
    body = json.dumps({"detail": detail}).encode()
    return body, [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(body)).encode()),
        (b"cache-control", b"no-store"),
        (b"x-content-type-options", b"nosniff"),
    ]


class SecurityMiddleware:
    def __init__(self, app: ASGIApp, settings: Settings) -> None:
        self.app = app
        self.settings = settings
        self.allowed_origins = set(settings.cors_origins)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
        method = scope.get("method", "GET").upper()

        if method in WRITE_METHODS:
            origin = headers.get("origin", "").rstrip("/")
            if origin not in self.allowed_origins:
                await self._reject(send, 403, "Requests must come from the website.")
                return
            content_type = headers.get("content-type", "").split(";")[0].strip().lower()
            if content_type != "application/json":
                await self._reject(send, 415, "Send JSON.")
                return
            try:
                declared = int(headers.get("content-length", "0") or 0)
            except ValueError:
                declared = 0
            if declared > self.settings.max_body_bytes:
                await self._reject(send, 413, "Request too large.")
                return

        received = 0
        limit = self.settings.max_body_bytes

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > limit:
                    raise _TooLarge()
            return message

        async def secured_send(message: Message) -> None:
            if message["type"] == "http.response.start":
                raw = [
                    (k, v)
                    for k, v in message.get("headers", [])
                    if k.lower() not in (b"cache-control", b"x-content-type-options")
                ]
                raw.append((b"x-content-type-options", b"nosniff"))
                if not any(k.lower() == b"cache-control" for k, _ in message.get("headers", [])):
                    raw.append((b"cache-control", b"no-store"))
                else:
                    raw.extend(
                        (k, v)
                        for k, v in message.get("headers", [])
                        if k.lower() == b"cache-control"
                    )
                message = {**message, "headers": raw}
            await send(message)

        try:
            await self.app(scope, limited_receive, secured_send)
        except _TooLarge:
            await self._reject(send, 413, "Request too large.")

    @staticmethod
    async def _reject(send: Send, status: int, detail: str) -> None:
        body, headers = _plain_response(status, detail)
        await send({"type": "http.response.start", "status": status, "headers": headers})
        await send({"type": "http.response.body", "body": body})


class _TooLarge(Exception):
    pass
