<div align="center">

<img src="docs/screenshots/banner.png" alt="Ascend AI" width="100%" />

# Ascend AI

### An AI-powered fitness tracking platform & social network for athletes

[![Live Demo](https://img.shields.io/badge/Live_Demo-ascend--ai--chi.vercel.app-7c5cff?style=for-the-badge)](https://ascend-ai-chi.vercel.app)

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5-092E20?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-JWT-A30000?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Groq](https://img.shields.io/badge/AI-Groq_Llama_3.3-F55036?logo=meta&logoColor=white)

</div>

---

**Ascend AI** is a production-grade, full-stack web app that combines a personal fitness
tracker with a complete social network. Users get personalised nutrition and training
targets, log daily check-ins, run guided workouts, chat with a real **AI coach**, and connect
with a community through a feed, direct messages, groups, challenges and leaderboards.

It ships with **three languages** (English / French / Arabic incl. RTL), a **dark/light theme**,
premium motion design, and a complete **free-tier cloud deployment**.

> 🔑 **Try it now:** open the [live demo](https://ascend-ai-chi.vercel.app) and log in with
> `demo@fitjourney.ai` / `demo12345` — or create your own account.
> *(First load may take ~30s while the free backend wakes up.)*

---

## 📸 Screenshots

| Dashboard | Analytics | Community Feed | AI Coach |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/dashboard.png" width="200" /> | <img src="docs/screenshots/analytics.png" width="200" /> | <img src="docs/screenshots/feed.png" width="200" /> | <img src="docs/screenshots/coach.png" width="200" /> |

---

## ✨ Features

**Fitness tracking**
- Smart onboarding with a metric engine (BMI, BMR, TDEE, macro/water/sleep targets — Mifflin-St Jeor)
- Daily check-ins with an automatic 0–100 daily score
- Workout library + a live session player that logs every set/rep and saves history
- Nutrition macro tracker with meal logging
- Interactive analytics (weight, calories, sleep, consistency, daily score)
- Gamification: XP, levels, streaks, achievements & badges

**AI Coach**
- A deterministic rules engine for explainable daily recommendations (free)
- A real conversational **LLM chatbot** grounded in your profile & data (premium / admin), powered by **Groq (Llama 3.3 70B)** with a graceful fallback

**Social network**
- Public profiles at `/u/<handle>`
- Feed with posts, likes & comments
- Follow system + instant friends
- Direct messaging with read receipts
- Member-gated **group chats** (join to unlock the conversation)
- Challenges, leaderboards, notifications & an activity feed

**Platform**
- Admin panel: user management with temporary bans & deletion
- i18n: English / French / Arabic with full right-to-left support
- Dark / light theme, Motion One animations, Lenis smooth scroll, a Three.js hero

---

## 🛠️ Tech Stack

**Frontend** — React 19 · TypeScript · Vite · React Router · Zustand · TanStack Query ·
Tailwind CSS · Motion One · Lenis · Three.js · Recharts · react-i18next

**Backend** — Python · Django · Django REST Framework · SimpleJWT · drf-spectacular ·
gunicorn · WhiteNoise · Pillow

**Data / AI / Infra** — PostgreSQL (Neon) · Groq LLM · Cloudinary · Hugging Face Spaces ·
Vercel · GitHub

---

## 🏗️ Architecture

A decoupled client–server design. A React single-page app talks to a stateless Django REST
API over HTTPS using JSON + JWT. The API persists to PostgreSQL, calls Groq for the AI coach,
and stores uploads in Cloudinary.

```
React SPA (Vercel)  ──JWT/JSON──►  Django REST API (Hugging Face)
                                        │
                   ┌────────────────────┼────────────────────┐
                   ▼                    ▼                    ▼
            PostgreSQL (Neon)     Groq LLM API        Cloudinary (media)
```

---

## 🚀 Getting Started (local)

**With Docker (one command):**
```bash
cp .env.example .env
docker compose up --build
# frontend → http://localhost:5173   ·   API docs → http://localhost:8000/api/docs/
```

**Native:**
```bash
# backend
cd backend
python -m venv .venv && .venv/Scripts/activate   # (Unix: source .venv/bin/activate)
pip install -r requirements.txt
python manage.py migrate && python manage.py seed_data && python manage.py runserver

# frontend (new terminal)
cd frontend
npm install && npm run dev
```
The seed creates demo content + a demo account (`demo@fitjourney.ai` / `demo12345`).

---

## ☁️ Deployment

Runs 100% on free tiers — **Vercel** (frontend) + **Hugging Face Spaces** (backend) +
**Neon** (PostgreSQL) + **Cloudinary** (media) + **Groq** (AI). Full step-by-step in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 👤 Author

**Ilyas Daoud El Asmi** — full-stack developer

[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/ilyasdaoudrma)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ilyas-daoud-el-asmi-0a531039b)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/ig_yas10/)

---

<div align="center"><sub>Built with Django, React & a lot of coffee ☕</sub></div>
