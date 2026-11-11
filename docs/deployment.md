# Deployment

The site runs on Vercel: Next.js for the pages and one Python serverless function (`api/index.py`) for the API. Supabase holds the data, Gemini is the LLM, Resend sends email.

## 1. Supabase

1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql`, and run it.
3. From **Project Settings → API**, copy the project URL and the secret (service-role) key.

The project for this site is `reuben-susanto-tutoring` (Singapore, `ap-southeast-1`), at `https://qairiehdhbdjgpcxzrdd.supabase.co`. The migration has already been applied to it. `vercel.json` runs the API in Vercel's Singapore region (`sin1`) so it sits next to the database.

## 2. Gemini

Create an API key at https://aistudio.google.com/apikey.

## 3. Resend (contact form email)

1. Sign up at https://resend.com **using the address enquiries should go to** (`reuben.zachary.rz@gmail.com`). Without a verified domain, Resend only delivers to the account owner's address.
2. Create an API key.

To send from your own domain later, verify the domain in Resend and set `CONTACT_FROM_EMAIL`.

## 4. Load the knowledge base

With the keys in your local `.env`:

```bash
npm run ingest
```

## 5. Vercel

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project** and import the repository. The framework is detected as Next.js; leave the build settings as they are.
3. Add the environment variables:

| Name | Value |
| --- | --- |
| `GEMINI_API_KEY` | from step 2 |
| `SUPABASE_URL` | from step 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 1 |
| `RESEND_API_KEY` | from step 3 |
| `CONTACT_TO_EMAIL` | `reuben.zachary.rz@gmail.com` |
| `NEXT_PUBLIC_SITE_URL` | your site address, e.g. `https://your-site.vercel.app` |
| `ALLOWED_ORIGINS` | the same address |

4. Deploy.

## 6. Check the live site

- `https://<your-site>/api/health` should return `"gemini": true, "supabase": true, "email": true`.
- Ask the chat a question, then a follow-up ("how much is it?").
- Send a test enquiry and confirm the email arrives and a row appears in the `enquiries` table.
- Open `/id` and check the Indonesian page.

## Recommended

- **Rate limiting**: in Vercel **Firewall**, add a rate-limit rule for `/api/chat` and `/api/contact` (for example 30 requests per minute per IP). The built-in limiter is per server instance.
- **Custom domain**: add it in Vercel, then update `NEXT_PUBLIC_SITE_URL` and `ALLOWED_ORIGINS`.
- **Gemini spending cap**: set a budget alert in Google AI Studio / Google Cloud.

## Updating the site

- **Wording, prices, design**: edit, commit, push. Vercel redeploys.
- **Assistant knowledge**: edit `knowledge/`, run `npm run ingest`. No redeploy needed.
- **Assistant behaviour** (`backend/src/prompts/`): edit, commit, push.

## Optional: backend on your own server

`deploy/home_server/` has a Dockerfile and compose file that run the API on port 8000:

```bash
docker compose -f deploy/home_server/docker-compose.yaml up -d --build
```

Put it behind HTTPS, then set `BACKEND_URL` on Vercel to its address. The website will send `/api/*` there instead of to the Vercel function.
