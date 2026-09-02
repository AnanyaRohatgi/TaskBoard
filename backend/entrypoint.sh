#!/usr/bin/env sh
set -e

# Wait for DB (simple loop)
if [ "$DATABASE_HOST" != "" ]; then
  echo "Waiting for database at $DATABASE_HOST:$DATABASE_PORT..."
  until nc -z $DATABASE_HOST $DATABASE_PORT; do
    sleep 1
  done
fi

# Run migrations
python manage.py migrate --noinput || true

# Create superuser if not exists (optional placeholder)
# python manage.py createsuperuser --no-input || true

# Run dev server (for production replace with gunicorn)
if [ "$DJANGO_DEBUG" = "1" ]; then
  python manage.py runserver 0.0.0.0:8000
else
  gunicorn backend.wsgi:application --bind 0.0.0.0:8000
fi
