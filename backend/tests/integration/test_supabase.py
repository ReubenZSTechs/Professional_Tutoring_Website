"""Live checks against the real Supabase project and Gemini.

Skipped unless GEMINI_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
are set in .env, and the knowledge base has been ingested.

    .venv/bin/python -m pytest backend/tests/integration -q
"""

import pytest
from core.config import get_settings
from llm.gemini import GeminiClient
from rag.embedder import Embedder
from rag.retriever import Retriever
from services.supabase import SupabaseClient

settings = get_settings()
pytestmark = [
    pytest.mark.live,
    pytest.mark.skipif(
        not (settings.gemini_ready and settings.supabase_ready),
        reason="Gemini and Supabase credentials are not configured",
    ),
]


@pytest.fixture
def retriever() -> Retriever:
    return Retriever(SupabaseClient(settings), Embedder(GeminiClient(settings)), settings)


async def test_embeddings_match_the_database_column():
    vector = await Embedder(GeminiClient(settings)).embed_query("How much are lessons?")
    assert len(vector) == settings.embed_dimensions


async def test_knowledge_base_is_ingested():
    rows = await SupabaseClient(settings).select(
        "documents", params={"select": "source", "limit": "1"}
    )
    assert rows, "No documents found. Run: npm run ingest"


async def test_search_returns_relevant_passages(retriever: Retriever):
    results = await retriever.search("How much is an IGCSE lesson?")
    assert results, "Search returned nothing"
    assert results[0].similarity >= settings.rag_min_similarity
    assert any("225,000" in chunk.content for chunk in results)
