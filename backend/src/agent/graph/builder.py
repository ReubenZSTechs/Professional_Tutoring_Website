"""Assemble the chat graph.

    screen ─┬─ blocked ──────────────────────────────────────────────► END
            └─ compile_history ─► rewrite_query ─┬─ canned ──────────► END
                                                 └─ retrieve ─► respond ─► END

To add a step, write a node in `nodes/`, register it here with
`add_node`, and connect it with `add_edge` or `add_conditional_edges`.
"""

from dataclasses import dataclass

from core.config import Settings
from guardrails.output import OutputPolicy
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from llm.gemini import GeminiClient
from rag.retriever import Retriever

from agent.graph.nodes.compile_history import make_compile_history
from agent.graph.nodes.respond import make_respond
from agent.graph.nodes.retrieve import make_retrieve
from agent.graph.nodes.rewrite_query import after_rewrite, make_canned, make_rewrite_query
from agent.graph.nodes.screen import after_screen, make_screen
from agent.graph.state import ChatState


@dataclass
class GraphDeps:
    """Everything the nodes need. Tests pass fakes here."""

    llm: GeminiClient
    settings: Settings
    output_policy: OutputPolicy
    retriever: Retriever | None = None


def build_graph(deps: GraphDeps) -> CompiledStateGraph:
    graph = StateGraph(ChatState)
    graph.add_node("screen", make_screen(deps.settings))
    graph.add_node("compile_history", make_compile_history(deps.llm, deps.settings))
    graph.add_node("rewrite_query", make_rewrite_query(deps.llm, deps.settings))
    graph.add_node("canned", make_canned())
    graph.add_node("retrieve", make_retrieve(deps.retriever))
    graph.add_node("respond", make_respond(deps.llm, deps.settings, deps.output_policy))

    graph.add_edge(START, "screen")
    graph.add_conditional_edges(
        "screen", after_screen, {"blocked": END, "continue": "compile_history"}
    )
    graph.add_edge("compile_history", "rewrite_query")
    graph.add_conditional_edges(
        "rewrite_query", after_rewrite, {"canned": "canned", "retrieve": "retrieve"}
    )
    graph.add_edge("canned", END)
    graph.add_edge("retrieve", "respond")
    graph.add_edge("respond", END)
    return graph.compile()
