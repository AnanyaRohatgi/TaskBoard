Trello-style Task Board - Starter

Stack
- Backend: Django + Django REST Framework
- Frontend: React (Vite)
- Database: PostgreSQL
- Containerisation: Docker + Docker Compose
- CI: GitHub Actions

Quickstart (local)
1. Copy .env.example to .env and set values.
2. Build and run with Docker Compose:
   docker compose up --build
3. Backend API: http://localhost:8000/api/
4. Frontend: http://localhost:3000/

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
