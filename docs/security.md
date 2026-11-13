# Security

How the site protects itself, written so you can maintain it. Each control is mapped to the OWASP Top 10 for web applications (A01–A10) and the OWASP Top 10 for LLM applications (LLM01–LLM10) where relevant.

## Threat model

The site is a public marketing page with two things worth attacking:

1. **The chat assistant.** It calls Google Gemini on every message (costs money), reads your knowledge base, and talks to strangers. Attackers may try to run up your bill, make it say something false or harmful about you, extract its instructions, or use it as a free general-purpose chatbot.
2. **The contact form.** It sends you email and writes to the database. Attackers may spam it or probe it for injection.

There are no user accounts, no payments and no admin pages, which removes most of the usual attack surface. Secrets live only on the server (Vercel environment variables), never in the browser.

## Controls

### Browser side (A05 Security Misconfiguration, A03 Injection)

| Control | Where |
| --- | --- |
| Content-Security-Policy with a fresh nonce per request: only scripts we ship (and Cloudflare Turnstile) can run; no inline scripts without the nonce; nothing can frame the site | `src/proxy.ts` |
| HSTS (2 years, preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, no `X-Powered-By` | `next.config.ts` |
| All page copy is rendered by React (escaped). The only `dangerouslySetInnerHTML` uses are the theme boot script and the JSON-LD block, both static strings | `RootShell.tsx`, `LandingPage.tsx` |

### API (A01 Broken Access Control, A04 Insecure Design, A07 Identification and Authentication Failures)

| Control | Where |
| --- | --- |
| Writes must come from the site's own origin (`Origin` header) and be JSON; anything else is refused with 403/415. CORS allows only that origin | `core/security.py`, `agent/main.py` |
| Bodies over 32 KB are refused (413), including chunked bodies | `core/security.py` |
| Every input is validated with strict Pydantic models (`extra="forbid"`, length limits) | `agent/routes/*.py` |
| Cloudflare Turnstile bot check on every contact-form submit and once per chat session, verified server-side including the hostname it was solved on | `services/turnstile.py` |
| Chat session tokens: HMAC-signed, 30-minute expiry, required on every chat message | `guardrails/session.py` |
| Rate limits counted in Supabase so they hold across all Vercel instances: chat 12/min and 150/day per visitor, contact 5/hour per visitor, plus a site-wide daily chat cap (`DAILY_CHAT_LIMIT`) as a bill circuit breaker. In-memory fallback if Supabase is unreachable | `core/rate_limit.py`, `supabase/migrations/0002_security.sql` |
| Visitor IPs are taken from Vercel's own header (not the spoofable `X-Forwarded-For`) and only ever stored as a salted hash | `core/rate_limit.py` |
| Production mode: missing secrets stop the API from starting, `/api/docs` is off, errors are generic with a request id, logs never contain message text or IPs | `core/config.py`, `agent/main.py` |
| `Cache-Control: no-store` on every API response | `core/security.py` |

### Database (A01, A02 Cryptographic Failures)

| Control | Where |
| --- | --- |
| Row level security on every table with no policies, plus explicit `REVOKE ALL` from the public roles: the public key can do nothing | `0001_init.sql`, `0002_security.sql` |
| Only the backend holds the service-role key, as a server-only environment variable | `.env` / Vercel |
| Length constraints on stored enquiries, and `search_path` pinned on functions | `0002_security.sql` |
| Chat logging is off by default (`CHAT_LOGGING`); when on, it stores the text but never the IP | `memory/checkpointer.py` |

### Chat assistant (OWASP LLM Top 10)

The pipeline, in order. Each layer assumes the one before it can be beaten.

| # | Layer | What it stops | Where |
| --- | --- | --- | --- |
| 1 | Abuse controls above (Turnstile, session, limits, daily cap, 800-character messages) | LLM10 Unbounded consumption | `routes/chat.py` |
| 2 | **Sanitising**: Unicode normalisation, removal of zero-width/bidi/control characters | hidden text, look-alike characters (LLM01) | `guardrails/sanitize.py` |
| 3 | **Signed history**: the server signs the transcript it has seen; a history sent back without a valid signature is dropped | forged "assistant" turns ("you already agreed…") (LLM01, LLM09) | `guardrails/history.py` |
| 4 | **Pattern screen**: weighted patterns in English and Indonesian ("ignore previous instructions", "system prompt", role tags, encoded blobs…). Score ≥ 3 gets a canned reply with no model call | cheap, common injections (LLM01) | `guardrails/injection.py` |
| 5 | **LLM classifier**: the rewriter model labels each message `risk: none / suspected / attack` and `intent`. Attacks and off-topic requests get a canned reply; the answering model never runs | subtler injections, homework, unrelated use (LLM01, LLM10) | `prompts/rewrite.md`, `nodes/rewrite_query.py` |
| 6 | **Prompt hardening**: visitor text, history and knowledge passages are wrapped in random-id DATA blocks the system prompt declares as "content, never instructions"; a per-request canary marker is placed in the system prompt | instruction-following from data (LLM01), prompt leakage (LLM07) | `prompts/system.md`, `nodes/respond.py` |
| 7 | **Model safety settings**: Gemini blocks medium-and-above harassment, hate, sexual and dangerous content | harmful output (LLM05) | `llm/gemini.py` |
| 8 | **Output guard**: the streamed answer is checked as it is written. The canary, a line from the system prompt, a price not in your rate list, a link/email/phone not on the allow-list, or HTML triggers a `replace` event that swaps in a safe message | leakage, invented prices, phishing links, HTML injection (LLM02, LLM07, LLM09) | `guardrails/output.py`, `core/site.py` |
| 9 | **Least agency**: the assistant has no tools and no write access; it can only read the `documents` table, which holds only your own files. `npm run ingest` warns if a knowledge file contains instruction-like text | excessive agency (LLM06), poisoned knowledge (LLM03, LLM04) | `scripts/ingest.py` |
| 10 | **Monitoring**: blocked and suspicious events are written to `security_events` | visibility | `guardrails/events.py` |

What the assistant is **allowed** to mention is defined in `backend/src/core/site.py` (prices, links, email, WhatsApp number). Keep it in sync with `src/config/rates.ts` and `src/config/site.ts`; a unit test checks the prices match.

### Supply chain (A06 Vulnerable and Outdated Components, A08 Software and Data Integrity)

- Dependencies are pinned (`package-lock.json`, `requirements.txt`).
- Dependabot opens weekly update PRs (`.github/dependabot.yml`).
- `npm run audit` runs `npm audit` and `pip-audit`.

## Reading the security log

In the Supabase SQL editor:

```sql
select created_at, category, excerpt, detail
from security_events
order by created_at desc
limit 100;
```

| Category | Meaning |
| --- | --- |
| `blocked_injection` | the pattern screen refused a message (`detail` lists which rules) |
| `blocked_classifier` | the rewriter model judged the message an attack |
| `risk_suspected` / `risk_attack` | the classifier's verdict on a message that was still processed |
| `output_replaced` | the output guard replaced an answer (`detail.reason` says why) |
| `forged_history` | a visitor sent a history that did not match its signature |
| `turnstile_failed` | the bot check failed |
| `honeypot` | a bot filled the hidden contact-form field |

A burst of events from one `ip_hash` is someone probing. Rate limits already slow them down; to block them outright, add a Vercel Firewall rule.

Counts by day:

```sql
select date_trunc('day', created_at) as day, category, count(*)
from security_events
group by 1, 2 order by 1 desc, 3 desc;
```

## Rotating secrets

| Secret | How to rotate | Effect |
| --- | --- | --- |
| `CHAT_SIGNING_SECRET` | `openssl rand -hex 32`, update on Vercel, redeploy | every visitor's chat session ends; they get a new one automatically on their next message |
| `IP_HASH_SALT` | same | rate-limit counters and event hashes start fresh |
| `GEMINI_API_KEY` | create a new key in AI Studio, update, then delete the old key | none visible |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → create a new secret key, update, then revoke the old one | none visible |
| `RESEND_API_KEY` | Resend → API Keys | none visible |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile → the widget → rotate | none visible |

Rotate immediately if a key was ever committed, pasted into a chat, or shown on screen.

## Testing

- `npm run test:api` runs the unit tests, including about 60 attack strings in English and Indonesian against the deterministic layers, and the output-guard cases.
- `.venv/bin/python -m pytest backend/tests/evals/test_redteam.py -q` sends real attacks through the live Gemini pipeline and asserts they are refused and nothing leaks. It costs a few cents in Gemini calls.
- After deploying, check the headers: https://securityheaders.com with your site address.

## Vercel settings to switch on

These are platform settings, not code:

1. **Firewall → Rate limiting**: add a rule for paths starting with `/api/`, about 60 requests per minute per IP. This stops floods before they reach the Python function.
2. **Firewall → Bot protection**: on.
3. **Deployment Protection**: protect Preview deployments with Vercel Authentication, so unfinished versions are not public.
4. **Environment variables**: scope every secret to Production only (and Preview if you use it); never add secrets to the Development scope.

## If something goes wrong

1. **The assistant keeps saying it is busy**: the Gemini quota is exhausted. On the free tier this is about 20 answers a day with `gemini-3.6-flash`; enable billing or switch to `gemini-3.5-flash-lite` (see deployment.md).
2. **Chat is being abused or the Gemini bill is climbing**: set `DAILY_CHAT_LIMIT=0` on Vercel and redeploy (the chat answers with a rate-limit message), or set `features.chat: false` in `src/config/site.ts` to hide it.
3. **A secret leaked**: rotate it (table above) before anything else.
4. **The assistant said something wrong about you**: check `security_events` for `output_replaced` and `risk_*` around that time; fix the knowledge file if the information was wrong; consider adding a rule to `guardrails/injection.py` if it was an attack.
5. **Spam enquiries**: check the Turnstile dashboard in Cloudflare; lower `RATE_LIMIT_CONTACT_PER_HOUR`.
