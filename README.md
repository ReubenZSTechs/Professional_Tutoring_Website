# Reuben Susanto Tutoring

A bilingual (English / Bahasa Indonesia) website for private online tutoring in Maths, Physics and Chemistry. It has three parts:

- **The landing page**: Next.js, built from one component per section.
- **An AI chat assistant**: answers visitors' questions from a knowledge base (RAG) using Google Gemini and Supabase.
- **A contact form**: saves each enquiry to Supabase and emails it to you through Resend.

## Where to edit things

| I want to change… | Edit this |
| --- | --- |
| Email, WhatsApp number, LinkedIn, GitHub, Instagram | `src/config/site.ts` |
| Years of experience, teaching hours, photos | `src/config/site.ts` (images in `public/images/`) |
| Switch the chat or the contact form on or off | `src/config/site.ts` (`features`) |
| Prices, lesson length, consultation length | `src/config/rates.ts` **and** `knowledge/tutoring/rates.md` |
| Any wording on the page | `src/content/en.ts` and `src/content/id.ts` |
| Subjects, topic lists, subject pages | `src/content/subjects.ts` |
| Colours (light and dark mode) and fonts | `src/app/globals.css` (`@theme` for light, `[data-theme="dark"]` for dark) |
| Order of sections, or add/remove one | `src/components/LandingPage.tsx` |
| The look of one section | `src/components/sections/<Section>.tsx` |
| What the chat assistant knows | Markdown files in `knowledge/`, then `npm run ingest` |
| How the chat assistant behaves | `backend/src/prompts/system.md` |
| How follow-up questions are rewritten | `backend/src/prompts/rewrite.md` |
| Gemini models, limits, chat logging | `.env` (see `.env.example`) |

After changing a file in `knowledge/`, run `npm run ingest` so the assistant picks it up. The page and the assistant read prices from different files, so change both.

### Still to fill in

- **Sharper photo** (optional): the current portrait is 390×490 px. To use a larger original, replace `public/images/reuben.jpg` (keep a 4:5 ratio and update `width`/`height` in `src/config/site.ts`) and `public/images/reuben-avatar.jpg` (a square head-and-shoulders crop).
- **Teaching hours**: set `teachingHours` in `src/config/site.ts`. The row is hidden while it is empty.
- **Rescheduling policy**: the FAQ gives a general answer. Replace it in `src/content/en.ts`, `src/content/id.ts` and `knowledge/tutoring/policies.md`.
- **Instagram**: optional, in `src/config/site.ts`.

## Run it locally

Requires Node 20+ and Python 3.12+.

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt pytest pytest-asyncio ruff
cp .env.example .env    # then fill in the keys
npm run dev
```

Open http://localhost:3000 (English) or http://localhost:3000/id (Indonesian). Subject pages live at `/subjects/<name>`, e.g. http://localhost:3000/subjects/university-mathematics. `npm run dev` starts the website on port 3000 and the Python API on port 8000.

The page works without any keys. The chat needs `GEMINI_API_KEY` plus Supabase, and the contact form needs Supabase or Resend.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Website and API together, with live reload |
| `npm run build` | Production build of the website |
| `npm run lint` / `npm run typecheck` | Check the frontend code |
| `npm run test:api` | Backend unit tests (no keys needed) |
| `npm run ingest` | Load `knowledge/` into Supabase |
| `npm run ingest -- --dry-run` | Preview the knowledge chunks without writing |

## Project layout

```
src/                  Website (Next.js)
  config/             site.ts (contact details, features), rates.ts (prices)
  content/            en.ts, id.ts: all page wording
  components/sections One file per page section
  components/chat     Chat widget
  components/contact  Enquiry form
  content/subjects.ts Subject cards and subject pages (topics by level)
  app/                Routes: /, /subjects/* (English); /id, /id/subjects/* (Indonesian)
backend/src/          API (FastAPI + LangGraph)
  agent/graph/        The chat graph and its nodes
  agent/routes/       /api/chat, /api/contact, /api/health
  prompts/            The assistant's instructions (markdown)
  rag/                Chunking, embeddings, retrieval
  services/           Supabase and email clients
api/index.py          Vercel entry point for the backend
knowledge/            What the assistant knows (markdown)
supabase/migrations/  Database schema
docs/                 Architecture, RAG, agent graph, deployment
```

## More documentation

- [Architecture](docs/architecture.md)
- [The agent graph](docs/agent-graph.md)
- [RAG and the knowledge base](docs/rag.md)
- [Deployment](docs/deployment.md)
