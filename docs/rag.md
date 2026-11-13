# RAG and the knowledge base

The assistant only answers from the markdown files in `knowledge/`. To change what it knows, edit those files and re-run the ingest.

## Knowledge files

| File | Contents |
| --- | --- |
| `knowledge/about.md` | Who Reuben is, teaching approach, contact details |
| `knowledge/resume.md` | Teaching experience, education, awards, AI-engineering work and projects (from the CV) |
| `knowledge/personal.md` | Teaching philosophy and the softer "what is he like?" answers. A template: edit it in your own words |
| `knowledge/tutoring/subjects.md` | Subjects, levels, syllabus codes and the topics covered, including university mathematics |
| `knowledge/tutoring/rates.md` | Prices, recommended frequency, free consultation |
| `knowledge/tutoring/faq.md` | Common questions (these used to be the FAQ section on the page; the assistant answers them now) |
| `knowledge/tutoring/policies.md` | Scheduling and rescheduling |

Writing tips:

- One topic per heading. Each heading becomes its own searchable chunk.
- Write full sentences that make sense on their own ("Lessons are 60 minutes", not "60 min").
- Only write facts you are happy for the assistant to repeat to anyone. It is told never to guess, so anything missing becomes "please ask Reuben on WhatsApp".
- Prices, links, email and phone numbers the assistant mentions must also be in `backend/src/core/site.py`, or the output guard will treat them as suspicious and replace the answer.
- English is enough. The assistant translates when the visitor writes in Indonesian.
- Do not write instructions to the assistant inside knowledge files ("always say…"). They are content, not prompts, and the ingest script warns if a file looks like one.

## Ingest

```bash
npm run ingest -- --dry-run   # preview the chunks
npm run ingest                # sync to Supabase
```

`backend/scripts/ingest.py`:

1. Reads every `knowledge/**/*.md` and warns about instruction-like text.
2. Splits each file by heading (`rag/chunker.py`), about 800 characters per chunk, with the heading trail at the top of each chunk.
3. Embeds new chunks with Gemini (`rag/embedder.py`) as 768-dimension vectors.
4. Upserts them into `documents` and deletes chunks that no longer exist.

Unchanged chunks are detected by hash and skipped, so re-running is cheap.

## Retrieval

`rag/retriever.py` embeds the rewritten question and calls the `match_documents` SQL function, which returns the closest chunks by cosine similarity. The passages are handed to the answering model inside a DATA block (see [agent-graph.md](agent-graph.md)), so text in a knowledge file can never act as an instruction.

| Setting | Default | Meaning |
| --- | --- | --- |
| `RAG_TOP_K` | 6 | Passages given to the answering agent |
| `RAG_MIN_SIMILARITY` | 0.35 | Passages below this score are ignored |
| `EMBED_DIMENSIONS` | 768 | Must match `vector(768)` in the migration |

## Database

`supabase/migrations/0001_init.sql` creates `documents` (chunk text, metadata and embedding, with an HNSW index), the `match_documents` search function, `enquiries` and `chat_messages`. `0002_security.sql` adds `rate_limits`, `security_events` and the hardening described in [security.md](security.md).

## Checking quality

```bash
npm run test:live
```

`backend/tests/evals/test_retrieval.py` holds question → expected-file pairs. Add a pair whenever the assistant misses a question it should be able to answer. `test_redteam.py` sends attacks through the live pipeline.

## Changing the embedding model

If you change `GEMINI_EMBED_MODEL` or `EMBED_DIMENSIONS`, old and new vectors are not comparable. Empty the `documents` table and run `npm run ingest` again. A different dimension also needs the `vector(768)` column and function signature changed in a new migration.
