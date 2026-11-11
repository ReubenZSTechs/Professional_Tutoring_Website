"""Node 3: look up knowledge passages for the rewritten query."""

from collections.abc import Awaitable, Callable

from core.logging import get_logger
from rag.retriever import Retriever
from tools.rag_search import rag_search

from agent.graph.state import ChatState

logger = get_logger(__name__)


def make_retrieve(retriever: Retriever | None) -> Callable[[ChatState], Awaitable[dict]]:
    async def retrieve(state: ChatState) -> dict:
        rewrite = state["rewrite"]
        if not rewrite["needs_retrieval"] or retriever is None or not retriever.ready:
            return {"documents": []}
        try:
            documents = await rag_search(rewrite["standalone_query"], retriever=retriever)
        except Exception:  # noqa: BLE001 - answer without passages rather than fail
            logger.exception("Retrieval failed; answering without passages")
            documents = []
        return {"documents": documents}

    return retrieve
