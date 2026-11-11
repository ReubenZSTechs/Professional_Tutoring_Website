"""Assemble the chat graph.

    compile_history -> rewrite_query -> retrieve -> respond

To add a step, write a node in `nodes/`, register it here with
`add_node`, and connect it with `add_edge`.
"""

from dataclasses import dataclass

from core.config import Settings
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from llm.gemini import GeminiClient
from rag.retriever import Retriever

from agent.graph.nodes.compile_history import make_compile_history
from agent.graph.nodes.respond import make_respond
from agent.graph.nodes.retrieve import make_retrieve
from agent.graph.nodes.rewrite_query import make_rewrite_query
from agent.graph.state import ChatState


@dataclass
class GraphDeps:
    """Everything the nodes need. Tests pass fakes here."""

    llm: GeminiClient
    settings: Settings
    retriever: Retriever | None = None


def build_graph(deps: GraphDeps) -> CompiledStateGraph:
    graph = StateGraph(ChatState)
    graph.add_node("compile_history", make_compile_history(deps.llm, deps.settings))
    graph.add_node("rewrite_query", make_rewrite_query(deps.llm, deps.settings))
    graph.add_node("retrieve", make_retrieve(deps.retriever))
    graph.add_node("respond", make_respond(deps.llm, deps.settings))

    graph.add_edge(START, "compile_history")
    graph.add_edge("compile_history", "rewrite_query")
    graph.add_edge("rewrite_query", "retrieve")
    graph.add_edge("retrieve", "respond")
    graph.add_edge("respond", END)
    return graph.compile()
