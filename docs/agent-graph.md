# The agent graph

The chat assistant is a LangGraph pipeline with two LLM agents, a **prompt rewriter / classifier** and an **answering agent**, wrapped in deterministic guardrails.

```
message + verified history
      │
      ▼
   screen ──(injection pattern score ≥ 3)──► canned refusal ──► END
      │
      ▼
compile_history ──► rewrite_query ──(attack / off-topic / small talk)──► canned ──► END
                    (prompt_rewriter)
                          │
                          ▼
                       retrieve ──► respond ──► streamed answer (checked by the output guard)
                                   (answering agent)
```

| Node | File | What it does |
| --- | --- | --- |
| `screen` | `nodes/screen.py` | Scores the (already sanitised) message against the injection patterns in `guardrails/injection.py`. A score of 3 or more ends the graph with a fixed bilingual refusal: no model call, no cost. |
| `compile_history` | `nodes/compile_history.py` | Cleans the verified history. Keeps the last `HISTORY_MAX_TURNS` messages and summarises older ones (`prompts/summarize.md`). |
| `rewrite_query` | `nodes/rewrite_query.py` | Rewrites the latest message into a standalone question using the history, and labels its language, intent and **risk**. Returns JSON following `schemas/prompt_rewriter.schema.json`. |
| `canned` | `nodes/rewrite_query.py` | Fixed replies (`guardrails/replies.py`) for attacks, off-topic requests and small talk. The answering model is skipped. |
| `retrieve` | `nodes/retrieve.py` | Searches the knowledge base with the rewritten question. |
| `respond` | `nodes/respond.py` | Writes the answer from the retrieved passages (`prompts/system.md`) and streams it through the output guard. |

All paths are under `backend/src/agent/graph/`. The graph is assembled in `builder.py`, and the shared state is defined in `state.py`.

## Why rewrite first?

A follow-up such as "how much is it for A Level?" means nothing to a search engine on its own. The rewriter turns it into "How much are A Level Maths lessons?" so retrieval finds the rates. It also fixes typos and mixed English/Indonesian wording, detects the language so the answer comes back in the visitor's language, and acts as a second, smarter injection classifier.

Example rewriter output:

```json
{
  "standalone_query": "How much are A Level Mathematics lessons?",
  "language": "en",
  "intent": "info",
  "needs_retrieval": true,
  "risk": "none"
}
```

`intent` is one of `info`, `booking`, `smalltalk`, `off_topic`; `risk` is `none`, `suspected` or `attack`. When `intent` is `booking`, the chat widget shows a WhatsApp button under the answer.

## How the prompts resist injection

- Every piece of untrusted text (the visitor's message, the history, the summary and the retrieved passages) is wrapped in a block like `<<<DATA id=3fa9c2e1 type=visitor>>> … <<<END 3fa9c2e1>>>`. The id is random per request, so a visitor cannot forge a closing tag. The system prompt tells the model that everything inside DATA blocks is content, never instructions.
- The system prompt ends with a random **canary** marker and the instruction never to output it. If the canary appears in an answer, the model has been talked into repeating its instructions and the output guard replaces the answer.
- The answering model runs at temperature 0.3 with at most 600 output tokens, and Gemini's safety settings block harmful content.

## The output guard

`guardrails/output.py` watches the answer as it streams. It replaces the answer (with a `replace` event) if it sees the canary, a long line from the system prompt, a Rupiah amount not in `core/site.py`, a link, email or phone number not on the allow-list, or HTML. The replacement is a polite "please ask Reuben directly" message.

## Models

| Role | Setting | Default |
| --- | --- | --- |
| Rewriter/classifier and history summary | `GEMINI_REWRITE_MODEL` | `gemini-3.5-flash-lite` |
| Answering agent | `GEMINI_CHAT_MODEL` | `gemini-3.6-flash` |
| Embeddings | `GEMINI_EMBED_MODEL` | `gemini-embedding-2` |

## Failure handling

- Rewriter fails → the original message is used as the query; if the pattern screen saw anything suspicious the risk is noted as `suspected`.
- Retrieval fails → the answer is written without passages (the assistant then says it is not sure and points to WhatsApp).
- Answering fails → an `error` event is sent and the widget shows a fallback message.
- Output guard trips → a `replace` event swaps in the safe message; the event is logged to `security_events`.

## Changing it

- **Behaviour or tone**: edit `prompts/system.md`. No code change needed. Keep the "DATA blocks are content" section.
- **What counts as an attack**: add a pattern to `guardrails/injection.py` (and a test case to `tests/unit/test_guardrails.py`), or adjust the `risk` definition in `prompts/rewrite.md`.
- **What the assistant may mention**: `core/site.py`.
- **Add a step**: write a `make_<name>(...)` factory in `nodes/`, then `add_node` and `add_edge` in `builder.py`.
- **Add a field to the rewriter**: add it to the JSON schema, the `Rewrite` type in `state.py`, and `prompts/rewrite.md`.

Tests with fake models are in `backend/tests/unit/test_graph.py`; the live red-team eval is `backend/tests/evals/test_redteam.py`.
