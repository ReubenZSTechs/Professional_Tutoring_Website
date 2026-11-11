"""The retrieval tool used by the graph: search, then format for the prompt."""

from rag.retriever import RetrievedChunk, Retriever


async def rag_search(query: str, *, retriever: Retriever) -> list[RetrievedChunk]:
    return await retriever.search(query)


def format_context(chunks: list[RetrievedChunk]) -> str:
    """Render retrieved chunks as numbered passages for the answering prompt."""
    if not chunks:
        return "(no relevant passages were found)"
    return "\n\n".join(
        f"[{number}] (from {chunk.source})\n{chunk.content}"
        for number, chunk in enumerate(chunks, start=1)
    )


def unique_sources(chunks: list[RetrievedChunk]) -> list[str]:
    seen: list[str] = []
    for chunk in chunks:
        if chunk.source not in seen:
            seen.append(chunk.source)
    return seen
