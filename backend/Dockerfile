FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Production start (Koyeb / any container host). docker-compose overrides this
# command for local dev. Binds to $PORT when the platform provides one.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py seed_data && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 1 --threads 8 --timeout 120"]
