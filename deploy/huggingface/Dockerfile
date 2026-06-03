# Hugging Face Space (Docker SDK) for the Ascend AI backend.
# This file lives in the HF Space repo. It clones the public GitHub repo and
# runs the Django REST API with gunicorn on port 7860 (HF's expected port).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev git \
    && rm -rf /var/lib/apt/lists/*

# Bump this value (or "Factory rebuild" the Space) to pull the latest code.
ARG CODE_VERSION=1
RUN git clone --depth 1 https://github.com/ilyasdaoudrma/ascend-ai.git repo

WORKDIR /app/repo/backend
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 7860

CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py seed_data && gunicorn config.wsgi:application --bind 0.0.0.0:7860 --workers 1 --threads 8 --timeout 120"]
