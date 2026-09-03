Trello-style Task Board

Stack
- Backend: Django + Django REST Framework
- Frontend: React + Vite
- Primary development database: PostgreSQL
- Lightweight fallback: SQLite for local non-Docker work
- Containerisation: Docker + Docker Compose
- CI: GitHub Actions

Recommended workflow
PostgreSQL through Docker is the primary development environment. SQLite remains available as an optional fallback for quick local development outside Docker.

Prerequisites
- Docker Desktop or Docker Engine
- Docker Compose v2
- Git
- Node.js 22+
- Python 3.11+

1) Configure environment
Copy `.env.example` to `.env` and review the values:

cp .env.example .env

The default Docker configuration uses PostgreSQL and is intended for `docker compose up`.

2) Start the full stack with Docker
From the project root:

docker compose up --build

This starts:
- PostgreSQL on `localhost:5432`
- Django API on `http://localhost:8000`
- React frontend on `http://localhost:3000`

3) Apply database migrations
The backend entrypoint runs Django migrations automatically at startup, but you can also run them manually:

docker compose exec backend python manage.py migrate

4) Seed demo data
Reuse the existing Django seed command:

docker compose exec backend python manage.py seed

This creates the demo user (`demo` / `demo`), a starter board, lists, cards, labels, comments, and token data.

5) Optional SQLite fallback
If you want a lightweight local run without Docker, keep a separate local environment:

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# set USE_SQLITE=1 in .env if you want SQLite for local dev
python manage.py migrate
python manage.py seed
python manage.py runserver

Then start the frontend separately:

cd ../frontend
npm ci
npm run dev -- --host

6) Reset the PostgreSQL database volume
If you need a clean database state:

docker compose down -v

docker compose up --build

This removes the named PostgreSQL volume and recreates it from scratch.

7) Production deployment (Render)
This app is prepared for a simple Render deployment pattern using one PostgreSQL database, one Django web service, and one static frontend service.

Recommended architecture:
- PostgreSQL database service (`Render Postgres`)
- Django backend web service on Render
- React frontend static site on Render

Deployment files:
- `render.yaml` declares the Render resource layout
- `.github/workflows/deploy.yml` triggers deployment hooks from GitHub Actions

Required GitHub secrets:
- `RENDER_BACKEND_DEPLOY_HOOK`
- `RENDER_FRONTEND_DEPLOY_HOOK`

After creating the Render services:
1. Copy the backend deploy webhook URL into `RENDER_BACKEND_DEPLOY_HOOK`.
2. Copy the frontend deploy webhook URL into `RENDER_FRONTEND_DEPLOY_HOOK`.
3. Push to `main` or trigger the deploy workflow manually.

The backend service expects these runtime variables:
- `DATABASE_URL`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=0`
- `USE_SQLITE=0`
- `ALLOWED_HOSTS=taskboard-api.onrender.com,localhost,127.0.0.1,0.0.0.0`
- `CORS_ALLOWED_ORIGINS=https://taskboard-frontend.onrender.com,http://localhost:3000`
- `FRONTEND_ORIGIN=https://taskboard-frontend.onrender.com`

The frontend service expects:
- `VITE_API_BASE_URL=https://taskboard-api.onrender.com/api`

Repository layout
- backend/: Django project and API apps
- frontend/: Vite React app
- docker-compose.yml: Docker services for Postgres, backend, and frontend
- render.yaml: Render deployment resource definitions
- .env.example: example environment file for Docker and local fallback
- .github/workflows/ci.yml: backend test + frontend build checks
- .github/workflows/deploy.yml: deployment pipeline using Render hooks

Notes
- Secrets and real credentials stay out of Git.
- `.env` is ignored by Git; only the example file is versioned.
- The app remains compatible with SQLite for non-Docker local development, while PostgreSQL remains the primary Dockerized database.
- Actual live deployment URLs depend on the external cloud account configuration and webhook secrets.

License: MIT
