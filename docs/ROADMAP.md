# FitJourney AI — Build Roadmap

This project is delivered in **vertical slices**: each phase is runnable and testable,
not a pile of disconnected stubs. Status legend: ✅ done · 🟡 partial · ⬜ planned.

## Phase 0 — Foundation (this commit)
- ✅ Monorepo + Docker Compose (Postgres, Django, React)
- ✅ Custom user model + JWT auth (register / login / refresh / me)
- ✅ Profile + onboarding with metric engine (BMI, TDEE, macros, water, sleep targets)
- ✅ Core fitness models (Goal, Exercise, Workout, WorkoutExercise, WorkoutSession, DailyCheckin, Meal, NutritionLog)
- ✅ Gamification models (Achievement, Badge, UserAchievement) + XP/level helpers
- ✅ AI coach rules engine (recommendations service, OpenAI-ready interface)
- ✅ Seed command (exercises, workouts, achievements, demo user)
- ✅ Swagger / OpenAPI docs
- ✅ Frontend: design system, Lenis smooth scroll, router, auth flow, dashboard shell

## Phase 1 — Dashboard & tracking UX ✅
- ✅ Recharts analytics page (weight, calories, sleep, consistency, daily score)
- ✅ Daily check-in form wired to API (computes daily score, evaluates achievements)
- ✅ Nutrition macro tracker + meal logging UI
- ✅ Workout player: start session → log sets (reps/weight/done) → complete → save history
- ✅ XP + achievement awarding on workout completion (celebration modal)
- ✅ Goals progress UI

## Phase 2 — Premium landing & 3D
- ⬜ Three.js cinematic hero (parallax, shine sweep, scroll dolly)
- ⬜ Motion One reveal system across landing sections
- ⬜ Full marketing sections (features, pricing, FAQ, testimonials)

## Phase 3 — Social network ✅
- ✅ Public profiles `/u/<handle>` (shareable without login) + auto-generated handles
- ✅ Feed (posts, likes, comments) with discover / following scopes + composer
- ✅ Follow system + "who to follow" suggestions
- ✅ Leaderboards (XP / streak / workouts, with "you" highlight)
- ✅ Social notifications (follow / like / comment / friend via signals) + unread badge
- ✅ Profile customization: avatar + banner upload, bio, accent, public toggle, "view my profile"
- ✅ Direct messaging (REST, polling) — rooms, read receipts, "Message" from profile
- ✅ Friends: request / accept / decline UI + suggestions
- ✅ Community groups (create / join / leave) + Challenges UI (join + progress)
- ✅ Activity feed (workouts / achievements / posts from people you follow, via signals)
- ⬜ Optional upgrade: Django Channels / WebSockets for live chat (REST works on free hosting)

## Admin panel ✅ (from core spec)
- ✅ Staff-only admin role + ban-aware JWT auth (banned users blocked from login & API)
- ✅ Admin panel UI: user table, search, temporary ban (with duration/reason), unban, delete
- ✅ Platform stats (users, active today, banned, posts, workouts)
- ✅ Seeded admin: admin@fitjourney.ai / admin12345

## Phase 4 — Hardening & free deployment 🟡
- ✅ Production settings via env (DEBUG off, SECRET_KEY, ALLOWED_HOSTS, CSRF/CORS, HSTS, SSL proxy header)
- ✅ gunicorn + WhiteNoise (hashed/compressed static), verified collectstatic
- ✅ Postgres via `DATABASE_URL` (Neon/Render/Supabase) with `sslmode=require`
- ✅ Cloudinary media storage for persistent avatar/banner uploads (toggles on `CLOUDINARY_URL`)
- ✅ `render.yaml` blueprint (backend) + `vercel.json` (frontend SPA rewrites) + `docs/DEPLOYMENT.md`
- ✅ Throttling already on (DRF AnonRateThrottle/UserRateThrottle); 23 backend + 3 frontend tests
- ⬜ CI pipeline (GitHub Actions), broader test coverage, production Dockerfiles
