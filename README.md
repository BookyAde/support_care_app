# Bountiful Support Plus

A support care agency management system built for accountability, verified visits, and compliance-ready records. Every visit is timestamped, GPS-logged, and note-verified, giving admins, workers, and clients one trustworthy source of truth instead of paper logs and phone calls.

**Live at:** [bssupport.care](https://bssupport.care)

## What's in this repo

This is a monorepo containing four separate applications that share one backend:

| Folder | What it is | Who uses it |
|---|---|---|
| `backend/` | FastAPI + PostgreSQL (Supabase) REST API | Powers all three frontends |
| `admin-app/` | Next.js — public marketing site + admin portal | Agency admins, and any visitor |
| `worker-app/` | Next.js — mobile-first PWA | Support workers in the field |
| `client-app/` | Next.js — mobile-first PWA | Clients and their families |

Each frontend is its own independent Next.js project with its own `package.json`, deployed separately. They all talk to the same backend via its REST API.

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, Alembic, PostgreSQL (Supabase), JWT auth, Resend (email)
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Hosting:** Railway (backend), Vercel (all three frontends)

## Running locally

You'll need four terminals open at once, backend plus each of the three frontends.

**1. Backend**
```powershell
cd backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```
Runs on `localhost:8000`. See `backend/README.md` for full setup, including the `.env` file you'll need to create from `.env.example`.

**2. Admin app**
```powershell
cd admin-app
npm run dev
```
Runs on `localhost:3000`.

**3. Worker app**
```powershell
cd worker-app
npm run dev -- -p 3001
```
Runs on `localhost:3001`.

**4. Client app**
```powershell
cd client-app
npm run dev -- -p 3002
```
Runs on `localhost:3002`.

Each frontend needs its own `.env.local` with `NEXT_PUBLIC_API_URL` pointing at the backend.

## Repo structure notes

- `.gitignore` excludes all `.env`/`.env.local` files, `node_modules/`, `venv/`, and `.next/` build output. Never commit real credentials, copy the relevant `.env.example` and fill in your own.
- Database migrations live in `backend/alembic/versions/`, run `alembic upgrade head` after pulling new migrations.
- `.github/workflows/keep-alive.yml` pings the backend's `/health` endpoint periodically to prevent Supabase's free-tier auto-pause.

## First-time setup on a fresh environment

1. Set up a Supabase project, copy its connection string into `backend/.env`
2. Run `alembic upgrade head` to create all tables
3. Run `python backend/create_admin.py` to create your first admin account (interactive, prompts for name/email/password)
4. Start the backend and log in through `admin-app`