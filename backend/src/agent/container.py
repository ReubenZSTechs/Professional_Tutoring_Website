"""Builds the shared services once per server instance.

Routes ask for what they need through `get_container()`. Tests replace
it with `app.dependency_overrides[get_container]`.
"""

from dataclasses import dataclass
from functools import lru_cache
from urllib.parse import urlparse

from core import site
from core.config import Settings, get_settings
from core.rate_limit import Policy, RateLimiter
from guardrails.events import SecurityEvents
from guardrails.output import OutputPolicy
from langgraph.graph.state import CompiledStateGraph
from llm.gemini import GeminiClient
from memory.checkpointer import ChatLog
from rag.embedder import Embedder
from rag.retriever import Retriever
from services.email import EmailService
from services.supabase import SupabaseClient
from services.turnstile import TurnstileVerifier

from agent.graph.builder import GraphDeps, build_graph


def build_output_policy(settings: Settings) -> OutputPolicy:
    """What the assistant is allowed to mention; everything else is a red flag."""
    hosts = set(site.ALLOWED_LINK_HOSTS)
    for origin in settings.cors_origins:
        host = urlparse(origin).hostname
        if host:
            hosts.add(host)
    # Per-session rates, plus simple multiples the assistant may legitimately
    # quote ("two sessions a week is Rp 450,000", "about Rp 1,800,000 a month").
    prices = {rate * n for rate in site.RATES_IDR.values() for n in range(1, 13)}
    return OutputPolicy(
        canary="",
        allowed_prices=prices,
        allowed_hosts=hosts,
        allowed_emails={site.CONTACT_EMAIL.lower()},
        allowed_phone_digits={site.WHATSAPP_DIGITS},
    )


@dataclass
class Policies:
    chat_minute: Policy
    chat_day: Policy
    chat_global_day: Policy
    contact_hour: Policy


def build_policies(settings: Settings) -> Policies:
    return Policies(
        chat_minute=Policy("chat_min", settings.rate_limit_chat_per_min, 60),
        chat_day=Policy("chat_day", settings.rate_limit_chat_per_day, 86_400),
        chat_global_day=Policy("chat_global", settings.daily_chat_limit, 86_400),
        contact_hour=Policy("contact_hour", settings.rate_limit_contact_per_hour, 3_600),
    )


@dataclass
class Container:
    settings: Settings
    graph: CompiledStateGraph
    supabase: SupabaseClient
    email: EmailService
    chat_log: ChatLog
    limiter: RateLimiter
    policies: Policies
    turnstile: TurnstileVerifier
    events: SecurityEvents


@lru_cache
def get_container() -> Container:
    settings = get_settings()
    llm = GeminiClient(settings)
    supabase = SupabaseClient(settings)
    retriever = Retriever(supabase, Embedder(llm), settings)
    return Container(
        settings=settings,
        graph=build_graph(
            GraphDeps(
                llm=llm,
                settings=settings,
                output_policy=build_output_policy(settings),
                retriever=retriever,
            )
        ),
        supabase=supabase,
        email=EmailService(settings),
        chat_log=ChatLog(supabase, settings),
        limiter=RateLimiter(supabase, settings),
        policies=build_policies(settings),
        turnstile=TurnstileVerifier(settings),
        events=SecurityEvents(supabase),
    )
