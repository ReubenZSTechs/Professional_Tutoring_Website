# The agent graph

The chat assistant is a small LangGraph pipeline with two LLM agents: a **prompt rewriter** and an **answering agent**.

```
message + history
      │
      ▼
compile_history ──► rewrite_query ──► retrieve ──► respond ──► streamed answer
                   (prompt_rewriter)              (answering agent)
```

| Node | File | What it does |
| --- | --- | --- |
| `compile_history` | `nodes/compile_history.py` | Cleans the history from the browser. Keeps the last `HISTORY_MAX_TURNS` messages and summarises older ones (`prompts/summarize.md`). |
| `rewrite_query` | `nodes/rewrite_query.py` | Rewrites the latest message into a standalone question using the history, and labels its language and intent. Returns JSON following `schemas/prompt_rewriter.schema.json`. |
| `retrieve` | `nodes/retrieve.py` | Searches the knowledge base with the rewritten question (skipped for small talk and off-topic messages). |
| `respond` | `nodes/respond.py` | Writes the answer from the retrieved passages (`prompts/system.md`) and streams it. |

All paths are under `backend/src/agent/graph/`. The graph is assembled in `builder.py`, and the shared state is defined in `state.py`.

## Why rewrite first?

A follow-up such as "how much is it for A Level?" means nothing to a search engine on its own. The rewriter turns it into "How much are A Level Maths lessons?" so retrieval finds the rates. It also fixes typos and mixed English/Indonesian wording, and detects the language so the answer comes back in the visitor's language.

Example rewriter output:

```json
{
  "standalone_query": "How much are A Level Mathematics lessons?",
  "language": "en",
  "intent": "info",
  "needs_retrieval": true
}
```

`intent` is one of `info`, `booking`, `smalltalk`, `off_topic`. When it is `booking`, the chat widget shows a WhatsApp button under the answer.

## Models

| Role | Setting | Default |
| --- | --- | --- |
| Rewriter and history summary | `GEMINI_REWRITE_MODEL` | `gemini-3.5-flash-lite` |
| Answering agent | `GEMINI_CHAT_MODEL` | `gemini-3.6-flash` |
| Embeddings | `GEMINI_EMBED_MODEL` | `gemini-embedding-2` |

## Failure handling

- Rewriter fails → the original message is used as the query.
- Retrieval fails → the answer is written without passages (the assistant then says it is not sure and points to WhatsApp).
- Answering fails → an `error` event is sent and the widget shows a fallback message.

## Changing it

- **Behaviour or tone**: edit `prompts/system.md`. No code change needed.
- **Add a step**: write a `make_<name>(...)` factory in `nodes/`, then `add_node` and `add_edge` in `builder.py`.
- **Add a field to the rewriter**: add it to the JSON schema, the `Rewrite` type in `state.py`, and `prompts/rewrite.md`.

Tests with fake models are in `backend/tests/unit/test_graph.py`.
