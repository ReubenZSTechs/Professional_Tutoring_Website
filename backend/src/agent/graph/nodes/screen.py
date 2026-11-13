"""Node 0: refuse obvious injection attempts before any model call."""

from collections.abc import Callable

from core.config import Settings
from guardrails.injection import score_injection
from guardrails.replies import BLOCKED

from agent.graph.state import ChatState


def make_screen(settings: Settings) -> Callable[[ChatState], dict]:
    def screen(state: ChatState) -> dict:
        verdict = score_injection(state["message"])
        if verdict.score >= settings.injection_block_score:
            lang = state.get("ui_language", "en")
            return {"blocked": "injection:" + ",".join(verdict.labels), "answer": BLOCKED[lang]}
        return {}

    return screen


def after_screen(state: ChatState) -> str:
    return "blocked" if state.get("blocked") else "continue"
