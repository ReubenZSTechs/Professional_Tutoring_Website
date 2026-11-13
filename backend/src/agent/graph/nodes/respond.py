"""Node 4: the answering agent.

Writes the reply from the retrieved passages and streams it out piece by
piece through LangGraph's custom stream, which the chat route forwards
to the browser. An output guard watches the stream and replaces the
answer if it leaks instructions or invents prices or contact details.
"""

import secrets
from collections.abc import Awaitable, Callable
from pathlib import Path

from core.config import PROMPTS_DIR, Settings
from core.logging import get_logger
from guardrails.output import OutputPolicy, StreamGuard
from guardrails.replies import BUSY, REPLACED
from langgraph.config import get_stream_writer
from llm.gemini import GeminiClient, is_quota_error
from tools.rag_search import format_context

from agent.graph.state import ChatState, data_block, new_block_id, render_history

logger = get_logger(__name__)
LANGUAGE_NAMES = {"en": "English", "id": "Bahasa Indonesia"}


def build_answer_prompt(state: ChatState, block_id: str) -> str:
    rewrite = state["rewrite"]
    parts = [f"Reply in: {LANGUAGE_NAMES[rewrite['language']]}"]
    parts.append(
        "Knowledge:\n"
        + data_block("knowledge", format_context(state.get("documents", [])), block_id)
    )
    if state.get("summary"):
        parts.append(
            "Summary of the earlier conversation:\n"
            + data_block("conversation", state["summary"], block_id)
        )
    parts.append(
        "Recent conversation:\n"
        + data_block("conversation", render_history(state.get("recent", [])), block_id)
    )
    parts.append("Visitor's latest message:\n" + data_block("visitor", state["message"], block_id))
    if rewrite["standalone_query"] != state["message"]:
        parts.append(
            "The message understood in context:\n"
            + data_block("visitor", rewrite["standalone_query"], block_id)
        )
    return "\n\n".join(parts)


def make_respond(
    llm: GeminiClient,
    settings: Settings,
    policy_base: OutputPolicy,
    prompts_dir: Path = PROMPTS_DIR,
) -> Callable[[ChatState], Awaitable[dict]]:
    system_prompt = (prompts_dir / "system.md").read_text(encoding="utf-8")
    protected = OutputPolicy.protected_from_prompt(system_prompt)

    async def respond(state: ChatState) -> dict:
        writer = get_stream_writer()
        lang = state["rewrite"]["language"]
        # A fresh canary per request: if it ever appears in the answer, the
        # model has been talked into repeating its instructions.
        canary = "CANARY-" + secrets.token_hex(6)
        policy = OutputPolicy(
            canary=canary,
            allowed_prices=policy_base.allowed_prices,
            allowed_hosts=policy_base.allowed_hosts,
            allowed_emails=policy_base.allowed_emails,
            allowed_phone_digits=policy_base.allowed_phone_digits,
            protected_lines=protected,
        )
        guard = StreamGuard(policy)
        system = f"{system_prompt}\n\nConfidential marker (never output it): {canary}"
        block_id = new_block_id()
        try:
            async for text in llm.stream(
                build_answer_prompt(state, block_id),
                system=system,
                model=settings.gemini_chat_model,
                temperature=0.3,
                max_output_tokens=settings.answer_max_output_tokens,
            ):
                if guard.feed(text):
                    break
                writer({"type": "token", "text": text})
        except Exception as error:
            if not guard.text:
                if is_quota_error(error):
                    # Out of model quota: say so plainly instead of a generic failure.
                    logger.warning("Gemini quota exceeded; sending the busy reply")
                    writer({"type": "token", "text": BUSY[lang]})
                    return {"answer": BUSY[lang], "busy": True}
                raise
            logger.exception("Answer stream ended early; keeping the partial answer")
        if guard.finish():
            logger.warning("Output guard replaced an answer: %s", guard.violation)
            writer({"type": "replace", "text": REPLACED[lang]})
            return {"answer": REPLACED[lang], "replaced": guard.violation}
        return {"answer": guard.text}

    return respond
