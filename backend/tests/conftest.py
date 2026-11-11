"""Shared test helpers: fake Gemini, fake retriever, and an app wired to them."""

from collections.abc import AsyncIterator
from typing import Any

import pytest
from agent.container import Container, get_container
from agent.graph.builder import GraphDeps, build_graph
from agent.main import app
from core.config import Settings
from core.rate_limit import SlidingWindowLimiter
from fastapi.testclient import TestClient
from memory.checkpointer import ChatLog
from rag.retriever import RetrievedChunk


def make_settings(**overrides: Any) -> Settings:
    """Settings that never read the real .env file."""
    values = {"gemini_api_key": "test-key", **overrides}
    return Settings(_env_file=None, **values)


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
        self.answer = answer or ["Lessons cost ", "Rp 250,000 per session."]
        self.summary = summary
        self.prompts: dict[str, list[str]] = {"generate": [], "generate_json": [], "stream": []}

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
        }

    async def stream(self, prompt: str, **_: Any) -> AsyncIterator[str]:
        self.prompts["stream"].append(prompt)
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
                    content="IGCSE and O Level: Rp 250,000 per 60-minute session.",
                    similarity=0.82,
                )
            ]
        )

    async def search(self, query: str, **_: Any) -> list[RetrievedChunk]:
        self.queries.append(query)
        return self.chunks


class FakeSupabase:
    def __init__(self, ready: bool = True, fail: bool = False) -> None:
        self.ready = ready
        self.fail = fail
        self.inserted: list[tuple[str, dict]] = []
        self.updated: list[tuple[str, dict, dict]] = []

    async def insert(self, table: str, row: dict) -> dict:
        if self.fail:
            raise RuntimeError("database down")
        self.inserted.append((table, row))
        return {"id": "enquiry-1", **row}

    async def insert_many(self, table: str, rows: list[dict]) -> None:
        self.inserted.extend((table, row) for row in rows)

    async def update(self, table: str, values: dict, *, filters: dict) -> None:
        self.updated.append((table, values, filters))


class FakeEmail:
    def __init__(self, ready: bool = True, fail: bool = False) -> None:
        self.ready = ready
        self.fail = fail
        self.sent: list[dict] = []

    async def send_enquiry(self, enquiry: dict) -> None:
        if self.fail:
            raise RuntimeError("email down")
        self.sent.append(enquiry)


def make_container(
    *,
    settings: Settings | None = None,
    llm: FakeLLM | None = None,
    retriever: FakeRetriever | None = None,
    supabase: FakeSupabase | None = None,
    email: FakeEmail | None = None,
) -> Container:
    settings = settings or make_settings()
    llm = llm or FakeLLM(settings)
    supabase = supabase or FakeSupabase()
    return Container(
        settings=settings,
        graph=build_graph(
            GraphDeps(llm=llm, settings=settings, retriever=retriever or FakeRetriever())  # type: ignore[arg-type]
        ),
        supabase=supabase,  # type: ignore[arg-type]
        email=email or FakeEmail(),  # type: ignore[arg-type]
        chat_log=ChatLog(supabase, settings),  # type: ignore[arg-type]
        chat_limiter=SlidingWindowLimiter(settings.rate_limit_chat_per_min, 60),
        contact_limiter=SlidingWindowLimiter(settings.rate_limit_contact_per_hour, 3600),
    )


@pytest.fixture
def client_for():
    """Return a function that builds a TestClient around a given container."""

    def build(container: Container) -> TestClient:
        app.dependency_overrides[get_container] = lambda: container
        return TestClient(app)

    yield build
    app.dependency_overrides.clear()
