# Smart HR — Project & Task Collaboration

Full-stack web app for managing projects, tasks, members, comments, attachments, activity, and dashboards with strict server-side validation and RBAC.

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query + react-hook-form + Recharts.
- **Backend:** Express 5 + TypeScript, raw SQL via `pg` (no ORM), JWT auth.
- **Database:** PostgreSQL (Neon recommended).
- **Migrations:** `node-pg-migrate` over plain `.sql` files.
- **Deployment:** Both apps to Vercel; backend as a Fluid Compute Function.

## Repo layout

```
backend/   Express API (deploys as a Vercel Function via api/index.ts)
frontend/  Next.js app
```

## Local setup

### Prerequisites
- Node.js 20+ (project tested on 25.x)
- A Postgres database. Easiest: a free Neon project (https://neon.tech). The connection string ends with `?sslmode=require`.

### 1. Backend

```bash
cd backend
cp .env.example .env       # fill in DATABASE_URL + JWT secrets
npm install
npm run migrate:up         # creates schema in your Postgres
npm run db:seed            # inserts demo users + projects + tasks
npm run dev                # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
# .env.local already has NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install                # (already done if scaffold completed)
npm run dev                # http://localhost:3000
```

Open http://localhost:3000 and click **Use demo account** to sign in as the admin.

## Demo credentials

| Role            | Email               | Password   |
|-----------------|---------------------|------------|
| Admin           | admin@demo.test     | Admin@123  |
| Project Manager | pm@demo.test        | Pm@12345   |
| Team Member 1   | member1@demo.test   | Member@1   |
| Team Member 2   | member2@demo.test   | Member@2   |

## Environment variables

**Backend (`backend/.env`)**

| Key                  | Notes                                                  |
|----------------------|--------------------------------------------------------|
| `DATABASE_URL`       | Postgres connection string                             |
| `JWT_ACCESS_SECRET`  | Long random string                                     |
| `JWT_REFRESH_SECRET` | Different long random string                           |
| `ACCESS_TOKEN_TTL`   | e.g. `15m` (default)                                   |
| `REFRESH_TOKEN_TTL`  | e.g. `7d` (default)                                    |
| `CORS_ORIGIN`        | Frontend URL (default `http://localhost:3000`)         |
| `PORT`               | Default `4000`                                         |
| `MAX_ATTACHMENT_BYTES` | Max upload size in bytes (default `5242880` = 5 MB)  |

**Frontend (`frontend/.env.local`)**

| Key                   | Notes                                       |
|-----------------------|---------------------------------------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL, e.g. `…/api/v1`           |

## Roadmap

| Phase | Scope                                                                                  | Status |
|-------|----------------------------------------------------------------------------------------|--------|
| M1    | Repo scaffold, SQL migrations, auth + RBAC, demo login                                 | done   |
| M2    | Projects + Tasks CRUD + validation rules + soft-delete                                 |        |
| M3    | Members, assignment, workload, activity log                                            |        |
| M4    | Dashboard KPIs + charts + search/filter/sort/pagination                                |        |
| M5    | Comments, attachments, notifications, dark mode, settings page                         |        |
| M6    | Deploy to Vercel + Neon                                                                |        |

## Deployment (preview)

Two Vercel projects pointed at the one repo:

- `smart-hr-api` — root `backend/`. Vercel detects `api/index.ts` and runs the Express app as a single Fluid Compute Function. Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` (the frontend URL).
- `smart-hr-web` — root `frontend/`. Set `NEXT_PUBLIC_API_URL` to the api project's URL + `/api/v1`.

Neon is the recommended Postgres — install it via the Vercel Marketplace and the `DATABASE_URL` is provisioned into the api project's env automatically.
