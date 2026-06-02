# Deploying FitJourney AI for free

A portfolio-grade, $0 deployment:

| Piece | Service | Free tier notes |
| --- | --- | --- |
| Database | **Neon** (Postgres) | 0.5 GB, auto-suspends when idle |
| Backend | **Render** (web service) | Sleeps after ~15 min idle (cold start ~30–50s) |
| Image uploads | **Cloudinary** | 25 GB storage/bandwidth — needed because Render's disk is wiped on each deploy |
| Frontend | **Vercel** | Generous static hosting + global CDN |

Total time: ~20 minutes. You'll need a GitHub account with this repo pushed.

---

## 1. Database — Neon

1. Create an account at **neon.tech** → **New Project**.
2. Copy the **connection string** (looks like
   `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).
3. Keep it for step 3 (`DATABASE_URL`).

## 2. Image storage — Cloudinary

1. Sign up at **cloudinary.com** (free "Programmable Media" plan).
2. On the dashboard, copy the **API Environment variable** —
   `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`.
3. Keep it for step 3. Without this, avatars/banners would vanish on every redeploy.

## 3. Backend — Render

This repo ships a **`render.yaml` blueprint**, so Render configures itself.

1. Push this repo to GitHub.
2. Render dashboard → **New + → Blueprint** → select your repo. Render reads
   `render.yaml` and creates the `fitjourney-api` web service.
3. Fill in the env vars it prompts for (the `sync: false` ones):
   - `DATABASE_URL` → your Neon string (step 1)
   - `CLOUDINARY_URL` → your Cloudinary string (step 2)
   - `DJANGO_ALLOWED_HOSTS` → `fitjourney-api.onrender.com` (your service URL host)
   - `CORS_ALLOWED_ORIGINS` → your Vercel URL (set after step 4, e.g. `https://fitjourney.vercel.app`)
   - `CSRF_TRUSTED_ORIGINS` → same Vercel URL
   - `DJANGO_SECRET_KEY` is auto-generated; `DJANGO_DEBUG` is already `0`.
4. Deploy. The build runs `collectstatic`, `migrate`, and `seed_data`
   (creating the demo + admin accounts). Health check hits `/api/docs/`.

> If you set `CORS_ALLOWED_ORIGINS` only after deploying the frontend, just edit
> the env var in Render afterwards and it redeploys.

## 4. Frontend — Vercel

1. Vercel dashboard → **Add New → Project** → import the repo.
2. Set **Root Directory = `frontend`** (Vercel auto-detects Vite via `vercel.json`).
3. Add an environment variable:
   - `VITE_API_URL = https://fitjourney-api.onrender.com/api/v1`
4. Deploy. `vercel.json` rewrites all routes to `index.html` so React Router works.

## 5. Connect the two

After both are live, make sure the backend's `CORS_ALLOWED_ORIGINS` and
`CSRF_TRUSTED_ORIGINS` contain the **exact** Vercel URL (https, no trailing slash),
then trigger a redeploy on Render.

## Demo & admin accounts

A sandbox **demo** account is always seeded so visitors can explore:

```
demo@fitjourney.ai / demo12345
```

The **admin** account (can ban/delete users) is **NOT** seeded with a default password
in production. To create one, set both env vars on Render before deploying:

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<a strong password>
```

If you don't set them, no admin is created — run `python manage.py createsuperuser`
from the Render shell instead. (Locally, `DEBUG=1` seeds `admin@fitjourney.ai / admin12345`.)

---

## Enabling the real AI Coach chatbot

The conversational AI Coach (Pro feature) calls a real LLM when a key is present,
otherwise it returns a data-aware fallback. To turn it on, add **one** env var on
Render (Environment tab):

- **`GROQ_API_KEY`** — free & fast (default model `llama-3.3-70b-versatile`). Get one at console.groq.com.
- or **`OPENAI_API_KEY`** — default model `gpt-4o-mini`.

Access is gated to **Pro subscribers and staff/admins** (so admins can test without
subscribing). The `/coach/subscribe/` endpoint is a stub — replace it with a Stripe
`checkout.session.completed` webhook that sets `Profile.is_premium = True`.

## Notes & limitations of the free tier

- **Cold starts:** the first request after idle wakes Render (~30–50s) and Neon. Normal for free.
- **Real-time chat** uses REST polling (not WebSockets) precisely so it survives free hosting.
  To upgrade to live WebSockets later, add Django Channels + a Redis channel layer
  (Upstash has a free Redis tier) and a paid/always-on backend.
- **Seeding** runs on every deploy but is idempotent, so it won't duplicate data.
- To disable demo seeding in production, remove `python manage.py seed_data` from the
  `buildCommand` in `render.yaml`.
