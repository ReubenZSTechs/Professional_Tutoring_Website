"""Builds the shared services once per server instance.

Routes ask for what they need through `get_container()`. Tests replace
it with `app.dependency_overrides[get_container]`.
"""

from dataclasses import dataclass
from functools import lru_cache

from core.config import Settings, get_settings
from core.rate_limit import SlidingWindowLimiter
from langgraph.graph.state import CompiledStateGraph
from llm.gemini import GeminiClient
from memory.checkpointer import ChatLog
from rag.embedder import Embedder
from rag.retriever import Retriever
from services.email import EmailService
from services.supabase import SupabaseClient

from agent.graph.builder import GraphDeps, build_graph


@dataclass
class Container:
    settings: Settings
    graph: CompiledStateGraph
    supabase: SupabaseClient
    email: EmailService
    chat_log: ChatLog
    chat_limiter: SlidingWindowLimiter
    contact_limiter: SlidingWindowLimiter


@lru_cache
def get_container() -> Container:
    settings = get_settings()
    llm = GeminiClient(settings)
    supabase = SupabaseClient(settings)
    retriever = Retriever(supabase, Embedder(llm), settings)
    return Container(
        settings=settings,
        graph=build_graph(GraphDeps(llm=llm, settings=settings, retriever=retriever)),
        supabase=supabase,
        email=EmailService(settings),
        chat_log=ChatLog(supabase, settings),
        chat_limiter=SlidingWindowLimiter(settings.rate_limit_chat_per_min, 60),
        contact_limiter=SlidingWindowLimiter(settings.rate_limit_contact_per_hour, 3600),
    )
