"""Minimal Supabase client built on httpx and the PostgREST API.

The backend needs four operations (insert, upsert, update/delete by
filter, call an RPC), so this small client is used instead of the full
`supabase` package. That keeps the Vercel function small and its cold
start fast. All calls use the service-role key and therefore must only
ever run on the server.
"""

from typing import Any

import httpx
from core.config import Settings, get_settings


class SupabaseError(RuntimeError):
    pass


class SupabaseClient:
    def __init__(
        self,
        settings: Settings | None = None,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self._transport = transport  # injected in tests

    @property
    def ready(self) -> bool:
        return self.settings.supabase_ready

    def _headers(self, prefer: str | None = None) -> dict[str, str]:
        key = self.settings.supabase_service_role_key
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        if not self.ready:
            raise SupabaseError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.")
        url = f"{self.settings.supabase_url.rstrip('/')}/rest/v1/{path}"
        async with httpx.AsyncClient(timeout=20, transport=self._transport) as client:
            response = await client.request(
                method, url, params=params, json=json, headers=self._headers(prefer)
            )
        if response.status_code >= 400:
            raise SupabaseError(f"{method} {path} -> {response.status_code}: {response.text[:300]}")
        if not response.content:
            return None
        return response.json()

    async def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        rows = await self._request("POST", table, json=row, prefer="return=representation")
        return rows[0] if rows else {}

    async def insert_many(self, table: str, rows: list[dict[str, Any]]) -> None:
        await self._request("POST", table, json=rows, prefer="return=minimal")

    async def upsert(self, table: str, rows: list[dict[str, Any]], *, on_conflict: str) -> None:
        await self._request(
            "POST",
            table,
            params={"on_conflict": on_conflict},
            json=rows,
            prefer="resolution=merge-duplicates,return=minimal",
        )

    async def update(self, table: str, values: dict[str, Any], *, filters: dict[str, str]) -> None:
        await self._request("PATCH", table, params=filters, json=values, prefer="return=minimal")

    async def delete(self, table: str, *, filters: dict[str, str]) -> None:
        await self._request("DELETE", table, params=filters, prefer="return=minimal")

    async def select(self, table: str, *, params: dict[str, str]) -> list[dict[str, Any]]:
        return await self._request("GET", table, params=params) or []

    async def rpc(self, function: str, args: dict[str, Any]) -> Any:
        return await self._request("POST", f"rpc/{function}", json=args)
