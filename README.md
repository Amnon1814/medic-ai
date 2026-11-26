# Medic.AI

## Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env   # add ANTHROPIC_API_KEY
python ingest.py                  # after adding trusted .txt sources to data/knowledge
uvicorn app.main:app --reload     # API docs: http://localhost:8000/docs

## Frontend
cd frontend && npm install && npm run dev

## Docker
docker compose up --build
