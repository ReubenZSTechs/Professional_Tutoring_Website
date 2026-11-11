"""Retrieval quality check.

For each question, the expected knowledge file must appear in the top
results. Run this after changing the knowledge files, the chunker or the
embedding model. Skipped without live credentials.

    .venv/bin/python -m pytest backend/tests/evals -q
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

# (question, knowledge file that should be retrieved)
CASES = [
    ("How much are IGCSE lessons?", "tutoring/rates.md"),
    ("Berapa biaya les IB per sesi?", "tutoring/rates.md"),
    ("Is there a discount if I book many lessons?", "tutoring/rates.md"),
    ("How does the free consultation work?", "tutoring/rates.md"),
    ("Do you teach A Level Maths?", "tutoring/subjects.md"),
    ("Apakah mengajar Kimia IGCSE?", "tutoring/subjects.md"),
    ("Which time zone are lessons in?", "tutoring/faq.md"),
    ("Apa yang dibutuhkan untuk les online?", "tutoring/faq.md"),
    ("How long has Reuben been teaching?", "resume.md"),
    ("Where does Reuben study and what is his GPA?", "resume.md"),
    ("How do I contact Reuben?", "about.md"),
    ("Can I reschedule a lesson?", "tutoring/policies.md"),
]
MIN_HIT_RATE = 0.8


async def test_expected_source_is_retrieved():
    retriever = Retriever(SupabaseClient(settings), Embedder(GeminiClient(settings)), settings)
    misses = []
    for question, expected in CASES:
        sources = {chunk.source for chunk in await retriever.search(question)}
        if expected not in sources:
            misses.append((question, expected, sorted(sources)))
    hit_rate = 1 - len(misses) / len(CASES)
    assert hit_rate >= MIN_HIT_RATE, f"hit rate {hit_rate:.0%}; misses: {misses}"
