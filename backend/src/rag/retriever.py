"""Find the knowledge chunks most relevant to a question."""

from dataclasses import dataclass

from core.config import Settings, get_settings
from services.supabase import SupabaseClient

from rag.embedder import Embedder


@dataclass
class RetrievedChunk:
    source: str
    title: str
    content: str
    similarity: float


class Retriever:
    def __init__(
        self,
        supabase: SupabaseClient,
        embedder: Embedder,
        settings: Settings | None = None,
    ) -> None:
        self.supabase = supabase
        self.embedder = embedder
        self.settings = settings or get_settings()

    @property
    def ready(self) -> bool:
        return self.supabase.ready and self.settings.gemini_ready

    async def search(
        self, query: str, *, top_k: int | None = None, min_similarity: float | None = None
    ) -> list[RetrievedChunk]:
        embedding = await self.embedder.embed_query(query)
        rows = await self.supabase.rpc(
            "match_documents",
            {
                "query_embedding": embedding,
                "match_count": top_k or self.settings.rag_top_k,
                "min_similarity": (
                    self.settings.rag_min_similarity if min_similarity is None else min_similarity
                ),
            },
        )
        return [
            RetrievedChunk(
                source=row["source"],
                title=(row.get("metadata") or {}).get("title", ""),
                content=row["content"],
                similarity=float(row["similarity"]),
            )
            for row in rows or []
        ]
