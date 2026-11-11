"""Node 4: the answering agent.

Writes the reply from the retrieved passages and streams it out piece by
piece through LangGraph's custom stream, which the chat route forwards
to the browser.
"""

from collections.abc import Awaitable, Callable
from pathlib import Path

from core.config import PROMPTS_DIR, Settings
from langgraph.config import get_stream_writer
from llm.gemini import GeminiClient
from tools.rag_search import format_context

from agent.graph.state import ChatState, render_history

LANGUAGE_NAMES = {"en": "English", "id": "Bahasa Indonesia"}


def build_answer_prompt(state: ChatState) -> str:
    rewrite = state["rewrite"]
    parts = [f"Reply in: {LANGUAGE_NAMES[rewrite['language']]}"]
    parts.append(f"Knowledge:\n{format_context(state.get('documents', []))}")
    if state.get("summary"):
        parts.append(f"Summary of the earlier conversation:\n{state['summary']}")
    parts.append(f"Recent conversation:\n{render_history(state.get('recent', []))}")
    parts.append(f"Visitor's latest message:\n{state['message']}")
    if rewrite["standalone_query"] != state["message"]:
        parts.append(f"The message understood in context:\n{rewrite['standalone_query']}")
    return "\n\n".join(parts)


def make_respond(
    llm: GeminiClient, settings: Settings, prompts_dir: Path = PROMPTS_DIR
) -> Callable[[ChatState], Awaitable[dict]]:
    system_prompt = (prompts_dir / "system.md").read_text(encoding="utf-8")

    async def respond(state: ChatState) -> dict:
        writer = get_stream_writer()
        pieces: list[str] = []
        async for text in llm.stream(
            build_answer_prompt(state),
            system=system_prompt,
            model=settings.gemini_chat_model,
        ):
            pieces.append(text)
            writer({"type": "token", "text": text})
        return {"answer": "".join(pieces)}

    return respond
