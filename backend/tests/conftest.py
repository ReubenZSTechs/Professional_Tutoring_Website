"""Shared test helpers: fake Gemini, retriever, Supabase, Turnstile, and an app wired to them."""

import time
from collections.abc import AsyncIterator
from typing import Any

import pytest
from agent.container import Container, build_output_policy, build_policies, get_container
from agent.graph.builder import GraphDeps, build_graph
from agent.main import app
from core.config import Settings
from core.rate_limit import RateLimiter
from fastapi.testclient import TestClient
from guardrails.events import SecurityEvents
from guardrails.session import issue_session_token
from memory.checkpointer import ChatLog
from rag.retriever import RetrievedChunk

ORIGIN = "http://localhost:3000"
SIGNING_SECRET = "test-signing-secret-that-is-long-enough-0123456789"


def make_settings(**overrides: Any) -> Settings:
    """Settings that never read the real .env file."""
    values = {
        "gemini_api_key": "test-key",
        "chat_signing_secret": SIGNING_SECRET,
        "ip_hash_salt": "test-salt-0123456789",
        "environment": "development",
        **overrides,
    }
    return Settings(_env_file=None, **values)


def session_token(settings: Settings) -> str:
    return issue_session_token(settings.chat_signing_secret, settings.chat_session_ttl_seconds)[0]


class FakeLLM:
    """Stands in for GeminiClient. Records every prompt it is given."""

    def __init__(
        self,
        settings: Settings,
        *,
        rewrite: dict | Exception | None = None,
        answer: list[str] | None = None,
        summary: str = "- Parent of a Year 10 student asking about IGCSE Physics",
    ) -> None:
        self.settings = settings
        self.rewrite = rewrite
        self.answer = answer or ["Lessons cost ", "Rp 225,000 per session."]
        self.summary = summary
        self.prompts: dict[str, list[str]] = {"generate": [], "generate_json": [], "stream": []}
        self.systems: dict[str, list[str]] = {"stream": []}

    async def generate(self, prompt: str, **_: Any) -> str:
        self.prompts["generate"].append(prompt)
        return self.summary

    async def generate_json(self, prompt: str, **_: Any) -> dict:
        self.prompts["generate_json"].append(prompt)
        if isinstance(self.rewrite, Exception):
            raise self.rewrite
        return self.rewrite or {
            "standalone_query": "How much are IGCSE Physics lessons?",
            "language": "en",
            "intent": "info",
            "needs_retrieval": True,
            "risk": "none",
        }

    async def stream(self, prompt: str, **kwargs: Any) -> AsyncIterator[str]:
        self.prompts["stream"].append(prompt)
        self.systems["stream"].append(kwargs.get("system", ""))
        for piece in self.answer:
            yield piece


class FakeRetriever:
    ready = True

    def __init__(self, chunks: list[RetrievedChunk] | None = None) -> None:
        self.queries: list[str] = []
        self.chunks = (
            chunks
            if chunks is not None
            else [
                RetrievedChunk(
                    source="tutoring/rates.md",
                    title="Lesson rates",
                    content="IGCSE and O Level: Rp 225,000 per 60-minute session.",
                    similarity=0.82,
                )
            ]
        )

    async def search(self, query: str, **_: Any) -> list[RetrievedChunk]:
        self.queries.append(query)
        return self.chunks


class FakeSupabase:
    """In-memory stand-in, including a faithful fixed-window rate limiter."""

    def __init__(self, ready: bool = True, fail: bool = False) -> None:
        self.ready = ready
        self.fail = fail
        self.inserted: list[tuple[str, dict]] = []
        self.updated: list[tuple[str, dict, dict]] = []
        self.counts: dict[tuple[str, int], int] = {}

    async def insert(self, table: str, row: dict) -> dict:
        if self.fail:
            raise RuntimeError("database down")
        self.inserted.append((table, row))
        return {"id": "enquiry-1", **row}

    async def insert_many(self, table: str, rows: list[dict]) -> None:
        self.inserted.extend((table, row) for row in rows)

    async def update(self, table: str, values: dict, *, filters: dict) -> None:
        self.updated.append((table, values, filters))

    async def rpc(self, function: str, args: dict) -> Any:
        if function != "hit_rate_limit":
            return []
        window = args["p_window_seconds"]
        bucket = (args["p_key"], int(time.time() // window))
        self.counts[bucket] = self.counts.get(bucket, 0) + 1
        return [{"allowed": self.counts[bucket] <= args["p_max"], "remaining": 0, "retry_after": 0}]

    def events(self) -> list[dict]:
        return [row for table, row in self.inserted if table == "security_events"]


class FakeTurnstile:
    def __init__(self, ok: bool = True, enabled: bool = True) -> None:
        self.ok = ok
        self.enabled = enabled
        self.tokens: list[str] = []

    async def verify(self, token: str, remote_ip: str) -> bool:
        self.tokens.append(token)
        return self.ok and bool(token)


class FakeEmail:
    def __init__(self, ready: bool = True, fail: bool = False) -> None:
        self.ready = ready
        self.fail = fail
        self.sent: list[dict] = []

    async def send_enquiry(self, enquiry: dict) -> None:
        if self.fail:
            raise RuntimeError("email down")
        self.sent.append(enquiry)


def make_graph(
    llm: FakeLLM, retriever: FakeRetriever | None = None, settings: Settings | None = None
):
    settings = settings or llm.settings
    return build_graph(
        GraphDeps(
            llm=llm,  # type: ignore[arg-type]
            settings=settings,
            output_policy=build_output_policy(settings),
            retriever=retriever,  # type: ignore[arg-type]
        )
    )


def make_container(
    *,
    settings: Settings | None = None,
    llm: FakeLLM | None = None,
    retriever: FakeRetriever | None = None,
    supabase: FakeSupabase | None = None,
    email: FakeEmail | None = None,
    turnstile: FakeTurnstile | None = None,
) -> Container:
    settings = settings or make_settings()
    llm = llm or FakeLLM(settings)
    supabase = supabase or FakeSupabase()
    return Container(
        settings=settings,
        graph=make_graph(llm, retriever or FakeRetriever(), settings),
        supabase=supabase,  # type: ignore[arg-type]
        email=email or FakeEmail(),  # type: ignore[arg-type]
        chat_log=ChatLog(supabase, settings),  # type: ignore[arg-type]
        limiter=RateLimiter(supabase, settings),
        policies=build_policies(settings),
        turnstile=turnstile or FakeTurnstile(),  # type: ignore[arg-type]
        events=SecurityEvents(supabase),
    )


@pytest.fixture
def client_for():
    """Return a function that builds a TestClient (sending a valid Origin) around a container."""

    def build(container: Container, *, origin: str | None = ORIGIN) -> TestClient:
        app.dependency_overrides[get_container] = lambda: container
        headers = {"origin": origin} if origin else {}
        return TestClient(app, headers=headers, raise_server_exceptions=False)

    yield build
    app.dependency_overrides.clear()
