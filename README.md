# Njangui

**Informal Economy Reputation Infrastructure for Cameroon**

[![CI](https://github.com/letschangeAfrica/njangui/actions/workflows/ci.yml/badge.svg)](https://github.com/letschangeAfrica/njangui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A lightweight, offline-first portable professional identity layer for Cameroonian informal workers to turn real-world transactions into verified reputations.

---

## Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI (Python) |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Database | PostgreSQL 15 + PostGIS |
| Background Tasks | Celery + Redis |
| Media Storage | Cloudinary |
| Auth | SMS OTP + 4-digit PIN + JWT |

## Project Structure

```
Njangui/
├── app/
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLAlchemy engine & session
│   ├── models/          # SQLAlchemy table definitions (9 tables)
│   ├── schemas/         # Pydantic request/response models
│   ├── routers/         # API route handlers
│   ├── services/        # Business logic (fraud rules, auth, etc.)
│   └── core/
│       └── config.py    # Environment settings
├── alembic/             # Database migrations
├── tests/               # Test suite
├── .env.example         # Environment variable template
└── requirements.txt
```

## Setup — Backend

```bash
# 1. Clone and enter the project
git clone https://github.com/letschangeAfrica/njangui.git
cd njangui

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and configure environment
copy .env.example .env

# 5. Run database migrations
alembic upgrade head

# 6. Start the API
uvicorn app.main:app --reload
```

Or via Docker (spins up the API, PostgreSQL, and Redis together):

```bash
docker-compose up --build
```

## Setup — Mobile

```bash
cd mobile
npm install
npm start                # Expo dev server (scan the QR code, or press w for web)
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` (or `.env.local`) to point at the
backend above — restart the Expo dev server after changing it.

## Health Check

```
GET /health → {"status": "ok", "app": "Njangui"}
```

## Testing

```bash
venv\Scripts\python.exe -m pytest tests/ -v   # backend
cd mobile && npm test                          # mobile
```

---

## License

MIT — see [LICENSE](LICENSE).

---

*Phase 1 — LOCKED. Phase 2 — LOCKED. Phase 3 — In Progress.*
*Ismaël Ariel Kagou Manga · May 2026 · Yaoundé, Cameroon*
