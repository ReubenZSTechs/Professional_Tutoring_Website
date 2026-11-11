# Architecture

```
Browser
  │  page (static HTML, / and /id)
  │  POST /api/chat     ── SSE stream ──┐
  │  POST /api/contact                  │
  ▼                                     ▼
Next.js on Vercel ── rewrite /api/* ──► FastAPI (api/index.py → backend/src)
                                          │
                     ┌────────────────────┼─────────────────────┐
                     ▼                    ▼                     ▼
               Google Gemini         Supabase               Resend
            (rewrite, answer,   (documents + pgvector,   (enquiry email)
               embeddings)       enquiries, chat log)
```

## Frontend

- **Next.js App Router**, statically rendered. `/` is English and `/id` is Indonesian. Each has its own root layout so `<html lang>` is correct, and both render the same `LandingPage` component with a different dictionary.
- **Wording** lives in `src/content/en.ts` and `id.ts`. Both follow the `Dictionary` type, so a missing translation is a type error. `{placeholders}` are filled from `src/config` by `getDictionary()`.
- **Sections** are server components. Only the header menu, the contact form and the chat widget run JavaScript in the browser.
- **Subject pages** (`/subjects/<slug>`, `/id/subjects/<slug>`) are generated at build time from `src/content/subjects.ts`, which also feeds the cards on the home page.
- **Styling** is Tailwind CSS v4. Design tokens are CSS variables in `src/app/globals.css`, named by role (`ink`, `body`, `card`, `brand`, `primary`…). Dark mode overrides the same variables under `[data-theme="dark"]`.
- **Theme**: a small inline script in `RootShell` sets `data-theme` before the first paint, from the visitor's saved choice or their system setting. `ThemeToggle` in the header switches it and saves the choice in `localStorage`.

## Backend

- **FastAPI** app in `backend/src/agent/main.py`, served under `/api`.
- `agent/container.py` builds the shared services once per instance. Routes receive them with `Depends(get_container)`, which is what the tests override.
- **Stateless**: chat history is kept in the visitor's browser tab (sessionStorage) and sent with each question. Nothing needs to persist between requests, which suits serverless.
- The backend is the only code that holds secrets. It uses the Supabase service-role key; every table has row level security with no public policies.

## Request flows

**Chat**: the widget posts the message and recent history → the graph runs (see [agent-graph.md](agent-graph.md)) → events stream back as Server-Sent Events (`meta`, `token`…, `done`).

**Contact**: the form posts to `/api/contact` → validated → stored in `enquiries` → emailed through Resend → `email_sent` set. If one of the two fails the enquiry still goes through; if both fail the visitor is shown WhatsApp and email links.

## Abuse protection

- Per-IP rate limits on chat and contact (`core/rate_limit.py`). They are per server instance, so add a Vercel Firewall rule for a hard global limit.
- Contact form honeypot field, input length limits, and HTML escaping in the email.
- The prompts treat visitor text and knowledge passages as data, not instructions.
