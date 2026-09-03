#!/usr/bin/env sh
set -eu

if [ -n "${DATABASE_HOST:-}" ]; then
  echo "Waiting for database at ${DATABASE_HOST}:${DATABASE_PORT:-5432}..."
  until nc -z "${DATABASE_HOST}" "${DATABASE_PORT:-5432}"; do
    sleep 1
  done
fi

python manage.py migrate --noinput

if [ "${DJANGO_DEBUG:-1}" = "1" ]; then
  python manage.py runserver 0.0.0.0:8000
else
  gunicorn backend.wsgi:application --bind 0.0.0.0:8000
fi
