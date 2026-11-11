"""Chunking and embedding."""

import math

from conftest import make_settings
from rag.chunker import chunk_markdown
from rag.embedder import Embedder, normalize
from tools.rag_search import format_context, unique_sources

DOC = """# Lesson rates

Intro paragraph.

## Rates per session
IGCSE is Rp 250,000.

### Notes
No discounts.

## Free consultation
Forty minutes on Zoom.
"""


def test_chunks_follow_headings_and_carry_their_trail():
    chunks = chunk_markdown(DOC, source="tutoring/rates.md")
    assert [c.heading for c in chunks] == [
        "Lesson rates",
        "Lesson rates > Rates per session",
        "Lesson rates > Rates per session > Notes",
        "Lesson rates > Free consultation",
    ]
    assert all(c.title == "Lesson rates" for c in chunks)
    assert chunks[1].content.startswith("Lesson rates > Rates per session\nIGCSE")
    assert [c.index for c in chunks] == [0, 1, 2, 3]


def test_long_sections_are_split_under_the_limit():
    body = "\n\n".join(f"Paragraph {n} " + "word " * 40 for n in range(12))
    chunks = chunk_markdown(f"# Doc\n\n{body}", source="doc.md", max_chars=500, overlap=50)
    assert len(chunks) > 3
    assert all(len(c.content) <= 500 + len("Doc\n") for c in chunks)
    assert "Paragraph 11" in chunks[-1].content


def test_hash_is_stable_and_changes_with_content():
    first = chunk_markdown(DOC, source="a.md")
    again = chunk_markdown(DOC, source="a.md")
    edited = chunk_markdown(DOC.replace("250,000", "275,000"), source="a.md")
    assert [c.content_hash for c in first] == [c.content_hash for c in again]
    assert first[1].content_hash != edited[1].content_hash
    assert first[3].content_hash == edited[3].content_hash


def test_file_name_is_the_title_when_there_is_no_h1():
    chunks = chunk_markdown("Just text.", source="tutoring/my-notes.md")
    assert chunks[0].title == "My Notes"
    assert chunks[0].content == "Just text."


class RecordingLLM:
    def __init__(self, model: str, merge_batches: bool = False) -> None:
        self.settings = make_settings(gemini_embed_model=model)
        self.calls: list[tuple[list[str], str | None]] = []
        self.merge_batches = merge_batches

    async def embed(self, texts, *, task_type=None):
        self.calls.append((texts, task_type))
        if self.merge_batches and len(texts) > 1:
            return [[3.0, 4.0]]
        return [[3.0, 4.0] for _ in texts]


async def test_embedding_2_gets_the_task_as_a_text_prefix():
    llm = RecordingLLM("gemini-embedding-2")
    embedder = Embedder(llm)  # type: ignore[arg-type]
    vector = await embedder.embed_query("how much?")
    await embedder.embed_documents([("Rates", "Rp 250,000"), ("", "No title")])
    assert llm.calls[0] == (["task: search result | query: how much?"], None)
    assert llm.calls[1][0] == ["title: Rates | text: Rp 250,000", "title: none | text: No title"]
    assert vector == [0.6, 0.8]


async def test_embedding_001_gets_task_type_instead():
    llm = RecordingLLM("gemini-embedding-001")
    embedder = Embedder(llm)  # type: ignore[arg-type]
    await embedder.embed_query("how much?")
    await embedder.embed_documents([("Rates", "Rp 250,000")])
    assert llm.calls == [(["how much?"], "RETRIEVAL_QUERY"), (["Rp 250,000"], "RETRIEVAL_DOCUMENT")]


async def test_falls_back_to_one_call_per_text_when_a_batch_is_merged():
    llm = RecordingLLM("gemini-embedding-2", merge_batches=True)
    vectors = await Embedder(llm).embed_documents([("A", "one"), ("B", "two")])  # type: ignore[arg-type]
    assert len(vectors) == 2
    assert [len(texts) for texts, _ in llm.calls] == [2, 1, 1]


def test_normalize_gives_unit_length():
    assert math.isclose(sum(v * v for v in normalize([1.0, 2.0, 2.0])), 1.0)
    assert normalize([0.0, 0.0]) == [0.0, 0.0]


def test_context_formatting():
    from rag.retriever import RetrievedChunk

    chunks = [
        RetrievedChunk("tutoring/rates.md", "Rates", "IGCSE Rp 250,000", 0.9),
        RetrievedChunk("tutoring/rates.md", "Rates", "IB Rp 325,000", 0.8),
        RetrievedChunk("about.md", "About", "Reuben is a tutor", 0.7),
    ]
    text = format_context(chunks)
    assert text.startswith("[1] (from tutoring/rates.md)\nIGCSE Rp 250,000")
    assert "[3] (from about.md)" in text
    assert unique_sources(chunks) == ["tutoring/rates.md", "about.md"]
    assert "no relevant passages" in format_context([])
