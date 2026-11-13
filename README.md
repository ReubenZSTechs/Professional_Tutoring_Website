# Reuben Susanto Tutoring

A bilingual (English / Bahasa Indonesia) website for private online tutoring in Maths, Physics and Chemistry, from IGCSE to university mathematics. It has three parts:

- **The landing page and subject pages**: Next.js, built from one component per section, with light and dark mode.
- **An "Ask me anything" assistant**: answers visitors' questions about Reuben and his lessons from a knowledge base (RAG) using Google Gemini and Supabase, behind a set of guardrails.
- **A contact form**: saves each enquiry to Supabase and emails it through Resend.

## Where to edit things

| I want to change… | Edit this |
| --- | --- |
| Email, WhatsApp number, LinkedIn, GitHub, Instagram | `src/config/site.ts` |
| Years of experience, teaching hours | `src/config/site.ts` |
| Photos | `public/images/` and `photos` in `src/config/site.ts` |
| Switch the chat or the contact form on or off | `src/config/site.ts` (`features`) |
| Prices, lesson length, consultation length | `src/config/rates.ts`, `knowledge/tutoring/rates.md` **and** `backend/src/core/site.py` |
| Any wording on the page, chat suggestions | `src/content/en.ts` and `src/content/id.ts` (`ask` and `chat` sections for the assistant) |
| Subjects, topic lists, subject pages | `src/content/subjects.ts` |
| Colours (light and dark mode), glass and animation settings, fonts | `src/app/globals.css` (`@theme` for light, `[data-theme="dark"]` for dark) |
| Order of sections, or add/remove one | `src/components/LandingPage.tsx` |
| The look of one section | `src/components/sections/<Section>.tsx` |
| What the assistant knows | Markdown files in `knowledge/` (`personal.md` is yours to fill in), then `npm run ingest` |
| How the assistant behaves | `backend/src/prompts/system.md` |
| How follow-up questions are rewritten and classified | `backend/src/prompts/rewrite.md` |
| What the assistant is allowed to mention (prices, links, contact details) | `backend/src/core/site.py` |
| Injection patterns, canned replies | `backend/src/guardrails/injection.py`, `replies.py` |
| Rate limits, Gemini models, chat logging | `.env` (see `.env.example`) |

After changing a file in `knowledge/`, run `npm run ingest` so the assistant picks it up. Prices appear in three files, so change all three; a test (`npm run test:api`) fails if the backend copy drifts from the page.

### Still to fill in

- **`knowledge/personal.md`**: a template for the softer questions parents ask. Rewrite it in your own words, then `npm run ingest`.
- **Teaching hours**: set `teachingHours` in `src/config/site.ts`. The row is hidden while it is empty.
- **Rescheduling policy**: the assistant gives a general answer. Replace it in `knowledge/tutoring/policies.md` and `faq.md`.
- **Instagram**: optional, in `src/config/site.ts`.
- **More photos** (optional): a real lesson setup or whiteboard photo would suit the About section. Stock photos would look less genuine, so none are used.

## Run it locally

Requires Node 20+ and Python 3.12+.

```bash
npm install
```

```bash
python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt pytest pytest-asyncio ruff pip-audit
```

```bash
cp .env.example .env    # then fill in the keys
```

```bash
npm run dev
```

Open http://localhost:3000 (English) or http://localhost:3000/id (Indonesian). Subject pages live at `/subjects/<name>`, e.g. http://localhost:3000/subjects/university-mathematics. `npm run dev` starts the website on port 3000 and the Python API on port 8000.

Locally `ENVIRONMENT=development`: the bot check uses Cloudflare's test keys (always passes), the API docs are at http://localhost:8000/api/docs, and `http://localhost:3000` is an allowed origin. The page works without any keys. The chat needs `GEMINI_API_KEY` plus Supabase, and the contact form needs Supabase or Resend.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Website and API together, with live reload |
| `npm run build` | Production build of the website |
| `npm run lint` / `npm run typecheck` | Check the frontend code |
| `npm run test:api` | Backend unit tests, including the guardrail red-team cases (no keys needed) |
| `npm run test:live` | Retrieval quality and live red-team evals against real Gemini and Supabase (needs keys) |
| `npm run ingest` | Load `knowledge/` into Supabase |
| `npm run ingest -- --dry-run` | Preview the knowledge chunks without writing |
| `npm run audit` | Check npm and Python dependencies for known vulnerabilities |

## Project layout

```
src/                  Website (Next.js)
  proxy.ts            Per-request Content-Security-Policy
  config/             site.ts (contact details, photos, features), rates.ts (prices)
  content/            en.ts, id.ts: all page wording; subjects.ts: subject cards and pages
  components/sections One file per page section (AskMe.tsx is the inline chat)
  components/chat     Chat provider, panel and floating widget
  components/contact  Enquiry form
  app/                Routes: /, /subjects/* (English); /id, /id/subjects/* (Indonesian)
backend/src/          API (FastAPI + LangGraph)
  agent/graph/        The chat graph and its nodes
  agent/routes/       /api/chat, /api/chat/session, /api/contact, /api/health
  guardrails/         Sanitising, injection screen, signed history, session tokens, output guard
  prompts/            The assistant's instructions (markdown)
  rag/                Chunking, embeddings, retrieval
  core/               Settings, security middleware, rate limits, site facts
  services/           Supabase, email and Turnstile clients
backend/main.py       Vercel entry point for the backend service
vercel.json           Vercel services: "app" (Next.js) and "backend" (FastAPI on /api/*)
knowledge/            What the assistant knows (markdown)
supabase/migrations/  Database schema and security hardening
docs/                 Architecture, agent graph, RAG, security, deployment
```

## More documentation

- [Architecture](docs/architecture.md)
- [The agent graph](docs/agent-graph.md)
- [RAG and the knowledge base](docs/rag.md)
- [Security](docs/security.md)
- [Deployment](docs/deployment.md)
