# Architecture

```
Browser
  │  page (/ and /id, subject pages)       CSP nonce + security headers (src/proxy.ts, next.config.ts)
  │  Turnstile bot check ────────────────► Cloudflare
  │  POST /api/chat/session               (Turnstile token → chat session token)
  │  POST /api/chat     ── SSE stream ──┐
  │  POST /api/contact                  │
  ▼                                     ▼
Vercel router ─┬─ /api/* ──► service "backend": FastAPI (backend/main.py → backend/src)
               └─ /*     ──► service "app": Next.js
                                          │  origin + size checks, rate limits, guardrails
                     ┌────────────────────┼─────────────────────┐
                     ▼                    ▼                     ▼
               Google Gemini         Supabase               Resend
            (rewrite/classify,  (documents + pgvector,   (enquiry email)
          answer, embeddings)    enquiries, rate_limits,
                                  security_events)
```

## Frontend

- **Next.js App Router.** `/` is English and `/id` is Indonesian. Each has its own root layout so `<html lang>` is correct, and both render the same `LandingPage` component with a different dictionary. Subject pages (`/subjects/<slug>`, `/id/subjects/<slug>`) are generated from `src/content/subjects.ts`, which also feeds the cards on the home page.
- **Rendering.** Pages are rendered per request (dynamic) because the Content-Security-Policy needs a fresh nonce each time. `src/proxy.ts` creates the nonce and the CSP header; `RootShell` passes the nonce to the two inline scripts (theme boot, JSON-LD).
- **Wording** lives in `src/content/en.ts` and `id.ts`. Both follow the `Dictionary` type, so a missing translation is a type error. `{placeholders}` are filled from `src/config` by `getDictionary()`.
- **Styling** is Tailwind CSS v4. Design tokens are CSS variables in `src/app/globals.css`, named by role (`ink`, `body`, `card`, `brand`, `primary`…). Dark mode overrides the same variables under `[data-theme="dark"]`. The `.glass` class is a frosted surface used on the header, the hero card and the chat pop-up only.
- **Theme.** A small inline script in `RootShell` sets `data-theme` before the first paint, from the visitor's saved choice or their system setting. `ThemeToggle` in the header switches it and saves the choice in `localStorage`.
- **Motion.** `RevealObserver` (mounted once in `RootShell`) watches every element with a `data-reveal` attribute and toggles `data-revealed` as it enters or leaves the viewport, recording which edge it left through. The CSS in `globals.css` fades and slides accordingly, so the animation plays in both scroll directions. `--reveal-i` staggers card grids. Without JavaScript (no `html.js` class) or with `prefers-reduced-motion`, nothing is hidden. The hero uses a one-off entrance (`.rise`, `.photo-in`).
- **Chat.** `ChatProvider` owns one conversation per page (`useChat`), shared by the inline "Ask me" section (`AskMe` → `ChatPanel`) and the floating `ChatWidget`. On the home page the floating button scrolls to the inline section and hides while it is on screen; on subject pages it opens a pop-up. The provider also hosts the invisible Turnstile widget.
- **Client protocol** (`src/lib/api.ts`, `useChat.ts`): before the first message the browser solves a Turnstile challenge and exchanges it for a session token (`/api/chat/session`). Each message sends the last signed window of the transcript with its signature; the `done` event returns the new signature. A `replace` event means the output guard replaced the answer. A `401` means the session expired: the client verifies again once and retries.

## Backend

- **Two Vercel services** (`vercel.json`): `app` (Next.js, the repo root) and `backend` (FastAPI, `backend/`). Vercel's router sends `/api/*` to `backend` with the full path, and everything else to `app`. Neither service calls the other server-side: the browser calls `/api/*` on the same domain, so no service bindings are needed.
- **FastAPI** app in `backend/src/agent/main.py`, served under `/api`. `backend/main.py` is the entry file Vercel loads; it only puts `src/` on the import path. In production (`ENVIRONMENT=production`) it refuses to start with missing secrets, hides the docs and returns generic errors.
- `core/security.py` is an ASGI middleware: origin and content-type checks on writes, a body-size cap, and `no-store`/`nosniff` headers on every response.
- `agent/container.py` builds the shared services once per instance: the graph, Supabase and email clients, the rate limiter, the Turnstile verifier and the security-event log. Routes receive it with `Depends(get_container)`, which is what the tests override.
- **Stateless.** Chat history is kept in the visitor's browser tab (sessionStorage) and sent with each question, protected by an HMAC signature. Nothing needs to persist between requests, which suits serverless.
- The backend is the only code that holds secrets. It uses the Supabase service-role key; every table has row level security with no policies and explicit revokes for the public roles.

## Request flows

**Chat**: Turnstile → session token → the widget posts the message, signed history and session token → origin/size/session/rate-limit checks → the graph runs (see [agent-graph.md](agent-graph.md)) → events stream back as Server-Sent Events (`meta`, `token`…, `replace`?, `done`).

**Contact**: the form solves Turnstile → posts to `/api/contact` → origin/size/rate-limit/Turnstile checks → validated and sanitised → stored in `enquiries` → emailed through Resend → `email_sent` set. If one of the two fails the enquiry still goes through; if both fail the visitor is shown WhatsApp and email links.

## Abuse protection

See [security.md](security.md) for the full list. In short: CSP and security headers in the browser; origin, size and bot checks plus durable per-visitor and site-wide rate limits on the API; and a layered set of guardrails around the chat assistant.
