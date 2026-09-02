Trello-style Task Board - Starter

Stack
- Backend: Django + Django REST Framework
- Frontend: React (Vite)
- Database: PostgreSQL
- Containerisation: Docker + Docker Compose
- CI: GitHub Actions

Quickstart (local)
1. Copy .env.example to .env and set values.
2. For fastest local development the project defaults to SQLite. Start Django and frontend separately (no need for Postgres):
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp ../.env.example .env
   # ensure USE_SQLITE=1 in .env (default)
   python manage.py migrate
   python manage.py seed
   # Start backend dev server
   python manage.py runserver

   # In a separate shell, start frontend
   cd ../frontend
   npm ci
   npm run dev -- --host

   Backend API: http://localhost:8000/api/
   Frontend: http://localhost:3000/

3. If you prefer to run with Docker Compose and Postgres, set USE_SQLITE=0 and run:
   docker compose up --build

Notes
- This repo is a starter scaffold. Implement models, serializers, frontend views and CI as needed.
- See backend/ and frontend/ folders for app entrypoints.

Repository layout
- backend/: Django project and apps
- frontend/: Vite React app
- docker-compose.yml: local compose for db/backend/frontend
- .github/workflows/ci.yml: basic CI job

Development workflow
- Work in feature branches and push to GitHub. CI will run on push.

License: MIT
