"""Turn text into embedding vectors for storage and for search.

Queries and documents are embedded slightly differently so that a short
question lands close to the passage that answers it:

* `gemini-embedding-2` takes the task as a text prefix.
* `gemini-embedding-001` takes it as the `task_type` parameter.
"""

import math

from llm.gemini import GeminiClient

BATCH_SIZE = 20


def normalize(vector: list[float]) -> list[float]:
    """Scale to unit length (needed when vectors are truncated to 768 dims)."""
    norm = math.sqrt(sum(v * v for v in vector))
    return [v / norm for v in vector] if norm else vector


class Embedder:
    def __init__(self, llm: GeminiClient) -> None:
        self.llm = llm

    @property
    def _uses_task_type(self) -> bool:
        return "embedding-001" in self.llm.settings.gemini_embed_model

    async def _embed(self, texts: list[str], task_type: str) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), BATCH_SIZE):
            batch = texts[start : start + BATCH_SIZE]
            result = await self.llm.embed(
                batch, task_type=task_type if self._uses_task_type else None
            )
            if len(result) != len(batch):
                # Some models merge a list into one vector; fall back to one call per text.
                result = [
                    (
                        await self.llm.embed(
                            [text], task_type=task_type if self._uses_task_type else None
                        )
                    )[0]
                    for text in batch
                ]
            vectors.extend(normalize(v) for v in result)
        return vectors

    async def embed_query(self, query: str) -> list[float]:
        text = query if self._uses_task_type else f"task: search result | query: {query}"
        return (await self._embed([text], "RETRIEVAL_QUERY"))[0]

    async def embed_documents(self, documents: list[tuple[str, str]]) -> list[list[float]]:
        """`documents` is a list of (title, text) pairs."""
        if self._uses_task_type:
            texts = [text for _, text in documents]
        else:
            texts = [f"title: {title or 'none'} | text: {text}" for title, text in documents]
        return await self._embed(texts, "RETRIEVAL_DOCUMENT")
