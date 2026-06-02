# FitJourney AI

An AI-powered fitness & gym progress tracking platform with a built-in fitness social network.

- **Frontend:** React 19 · Vite · TypeScript · React Router · Zustand · TanStack Query · TailwindCSS · Motion One · Lenis · Three.js · Recharts
- **Backend:** Django · Django REST Framework · SimpleJWT · drf-spectacular (Swagger) · Channels (WebSockets)
- **Database:** PostgreSQL

> This repository is built **foundation-first**: a runnable monorepo skeleton with the core
> domain (auth, profile, onboarding metrics, workouts, nutrition, check-ins, gamification)
> wired end-to-end, then grown in vertical slices. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Quick start (Docker Compose)

Requires **Docker Desktop**.

```bash
cp .env.example .env
docker compose up --build
```

Then:

| Service       | URL                                |
| ------------- | ---------------------------------- |
| Frontend      | http://localhost:5173              |
| Backend API   | http://localhost:8000/api/v1/      |
| Swagger docs  | http://localhost:8000/api/docs/    |
| Django admin  | http://localhost:8000/django-admin/|

On first boot the backend runs migrations and seeds demo data (exercises, workouts,
achievements) plus a demo account:

```
email:    demo@fitjourney.ai
password: demo12345
```

## Quick start (native, no Docker)

**Backend**

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |  Unix: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

By default native dev uses SQLite (no Postgres needed) unless `POSTGRES_HOST` is set.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

## Project layout

```
fitjourney-ai/
├── docker-compose.yml
├── .env.example
├── docs/
│   └── ROADMAP.md
├── backend/
│   ├── config/            # Django project (settings, urls, asgi/wsgi)
│   └── apps/
│       ├── accounts/      # Custom user, JWT auth, profile, onboarding
│       ├── fitness/       # goals, workouts, exercises, sessions, check-ins, nutrition
│       ├── gamification/  # achievements, badges, XP, streaks
│       └── coach/         # AI recommendation engine (rules now, OpenAI-ready)
└── frontend/
    └── src/
        ├── app/           # router, providers
        ├── components/    # shared UI
        ├── features/      # feature modules (auth, dashboard, ...)
        ├── lib/           # api client, query client, utilities
        ├── stores/        # zustand stores
        └── styles/        # design tokens + global css
```

## Deploy for free

Vercel (frontend) + Render (backend) + Neon (Postgres) + Cloudinary (uploads) — all
on free tiers. Step-by-step guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
The repo ships a `render.yaml` blueprint and `frontend/vercel.json` for a click-through setup.

## License

Proprietary — all rights reserved (template scaffold).
