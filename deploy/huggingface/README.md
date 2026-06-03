---
title: Ascend AI API
emoji: 🏋️
colorFrom: purple
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# Ascend AI — Backend API

Django REST + JWT backend for **Ascend AI**, an AI-powered fitness tracker and social
network. This Space builds the backend from the public repo:
https://github.com/ilyasdaoudrma/ascend-ai

Configure the required environment variables as **Space secrets** (see the project's
`docs/DEPLOYMENT.md`): `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS=.hf.space`,
`DATABASE_URL`, `CLOUDINARY_URL`, `GROQ_API_KEY`, `CORS_ALLOWED_ORIGINS`,
`CSRF_TRUSTED_ORIGINS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
