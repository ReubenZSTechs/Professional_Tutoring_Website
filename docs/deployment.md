# Deployment

The site runs on Vercel as one project with two **services** (`vercel.json`): `app` (Next.js, the repo root) serves the pages, and `backend` (FastAPI, the `backend/` folder) serves `/api/*`. Both run in Vercel's Singapore region (`sin1`). Python dependencies for the backend are read from `backend/requirements.txt`. Supabase holds the data, Gemini is the LLM, Resend sends email, Cloudflare Turnstile is the bot check.

## 1. Supabase

The project for this site is `reuben-susanto-tutoring` (Singapore, `ap-southeast-1`), at `https://qairiehdhbdjgpcxzrdd.supabase.co`. Both migrations (`0001_init.sql`, `0002_security.sql`) are applied.

For a new project: create it at https://supabase.com, open **SQL Editor**, paste and run each file in `supabase/migrations/` in order, then copy the project URL and the secret (service-role) key from **Project Settings → API Keys**.

## 2. Gemini

Create an API key at https://aistudio.google.com/apikey.

**Free tier warning.** A free-tier key allows only about 20 answers per day with `gemini-3.6-flash`, which is not enough for a public site: after that the assistant replies "busy, please use WhatsApp". Either enable billing for the key's Google Cloud project (pay-as-you-go; a chat answer costs a fraction of a cent) and set a budget alert, or set `GEMINI_CHAT_MODEL=gemini-3.5-flash-lite`, which has a much higher free allowance. Current limits: https://aistudio.google.com/docs/rate-limits.

## 3. Resend (contact form email)

1. Sign up at https://resend.com **using the address enquiries should go to** (`reuben.zachary.rz@gmail.com`). Without a verified domain, Resend only delivers to the account owner's address.
2. Create an API key.

To send from your own domain later, verify the domain in Resend and set `CONTACT_FROM_EMAIL`.

## 4. Cloudflare Turnstile (bot check)

1. In the Cloudflare dashboard open **Turnstile** and add a widget.
2. Hostnames: your site's hostname, e.g. `reuben-tutoring.vercel.app` (add your custom domain too when you have one). Widget mode: **Managed**.
3. Copy the **site key** (public) and **secret key** (server only).

Locally nothing is needed: in development the published test keys are used, so the check always passes.

## 5. Generate the two server secrets

```bash
openssl rand -hex 32   # IP_HASH_SALT
```

```bash
openssl rand -hex 32   # CHAT_SIGNING_SECRET
```

## 6. Load the knowledge base

With the keys in your local `.env`:

```bash
npm run ingest
```

## 7. Vercel

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project** and import the repository. The framework is detected as Next.js; leave the build settings as they are.
3. Add the environment variables. Scope means which deployments see the value: secrets go to **Production** (and Preview if you use previews), never Development.

| Name | Value | Scope | Public? |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `production` | Production | no |
| `NEXT_PUBLIC_SITE_URL` | `https://reuben-tutoring.vercel.app` (your real address) | Production | yes (public address) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | from step 4 | Production, Preview | yes (site key is public by design) |
| `TURNSTILE_SECRET_KEY` | from step 4 | Production, Preview | **secret** |
| `GEMINI_API_KEY` | from step 2 | Production, Preview | **secret** |
| `SUPABASE_URL` | from step 1 | Production, Preview | no |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 1 | Production, Preview | **secret** |
| `RESEND_API_KEY` | from step 3 | Production | **secret** |
| `CONTACT_TO_EMAIL` | `reuben.zachary.rz@gmail.com` | Production | no |
| `IP_HASH_SALT` | from step 5 | Production, Preview | **secret** |
| `CHAT_SIGNING_SECRET` | from step 5 | Production, Preview | **secret** |

Leave `ALLOWED_ORIGINS` unset: the API then accepts requests only from `NEXT_PUBLIC_SITE_URL`. If you use preview deployments with the chat, set `ENVIRONMENT=preview` there (anything other than `production`), or the preview's origin will be refused.

4. Deploy.

`vercel.json` defines the two services and routes `/api/*` to `backend` and everything else to `app`; there is nothing to configure in the dashboard's build settings. Environment variables are shared by both services, so add each one once at project level. To run both services locally the way Vercel does, use `vercel dev` (or keep using `npm run dev`, which runs the same two processes).

The API checks its configuration at startup. If a secret is missing in production it refuses to start and the function logs say which one.

## 8. Check the live site

- `https://<your-site>/api/health` should return `"gemini": true, "supabase": true, "email": true, "turnstile": "live"`.
- Ask the chat a question, then a follow-up ("how much is it?"), then something off-topic (it should decline).
- Send a test enquiry and confirm the email arrives and a row appears in the `enquiries` table.
- Open `/id` and a subject page.
- Paste the site address into https://securityheaders.com: it should score A.

## 9. Security checklist after the first deploy

1. **Vercel Firewall → Rate limiting**: a rule for paths starting with `/api/`, about 60 requests per minute per IP.
2. **Vercel Firewall → Bot protection**: on.
3. **Deployment Protection**: protect Preview deployments.
4. **Gemini budget alert** in Google Cloud.
5. **Turnstile analytics** in Cloudflare show solve rates; a sudden drop means bots.

Details and what each control does: [security.md](security.md).

## Updating the site

- **Wording, prices, design**: edit, commit, push. Vercel redeploys. If you change prices, update `src/config/rates.ts`, `knowledge/tutoring/rates.md` **and** `backend/src/core/site.py`.
- **Assistant knowledge**: edit `knowledge/`, run `npm run ingest`. No redeploy needed.
- **Assistant behaviour** (`backend/src/prompts/`) or guardrails (`backend/src/guardrails/`): edit, run `npm run test:api`, commit, push.

## Optional: backend on your own server

`deploy/home_server/` has a Dockerfile and compose file that run the API on port 8000:

```bash
docker compose -f deploy/home_server/docker-compose.yaml up -d --build
```

Put it behind HTTPS, set `ENVIRONMENT=production` and the same secrets in its `.env`, then set `BACKEND_URL` on Vercel to its address. The website will send `/api/*` there instead of to the Vercel function.
