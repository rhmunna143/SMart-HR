# Smart HR — Project & Task Collaboration

A full-stack team productivity app — manage projects, tasks, members, comments, and file attachments with role-based access control, a live dashboard, dark mode, and in-app notifications.

**🌐 Live demo** → [smart-hr-six.vercel.app](https://smart-hr-six.vercel.app)  
**🔌 API** → [smart-hr-backend-kappa.vercel.app](https://smart-hr-backend-kappa.vercel.app/api/v1/health)

---

## Features

- **RBAC** — Admin / Project Manager / Team Member with enforced server-side rules
- **Projects & Tasks** — full CRUD, soft-delete & restore, status workflow, priority levels
- **Dashboard** — KPI cards, task-by-status donut, activity sparklines (Recharts)
- **Comments & Attachments** — threaded comments and file uploads up to 5 MB (stored as BYTEA)
- **Notifications** — in-app bell with unread badge, polled every 30 s
- **Activity feed** — every mutation is logged and surfaced in the dashboard
- **Dark mode** — system-aware toggle, persisted via `next-themes`
- **Admin settings** — toggle Team Member visibility (`ASSIGNED_ONLY` ↔ `ALL`)
- **JWT auth** — 15-min access token + 7-day refresh token in an `httpOnly` cookie

---

## Tech stack

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · TanStack Query · react-hook-form · Recharts |
| **Backend** | Express 5 · TypeScript · raw SQL via `pg` (no ORM) · JWT |
| **Database** | PostgreSQL on [Neon](https://neon.tech) |
| **Deploy** | Vercel — two projects, one repo |

---

## Demo credentials

> Hit **Use demo account** on the login page to sign in as Admin without typing a password.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.test` | `Admin@123` |
| Project Manager | `pm@demo.test` | `Pm@12345` |
| Team Member 1 | `member1@demo.test` | `Member@1` |
| Team Member 2 | `member2@demo.test` | `Member@2` |

---

## Local development

### Prerequisites

- Node.js 20+
- A PostgreSQL database — easiest: a free [Neon](https://neon.tech) project  
  *(connection string ends with `?sslmode=require`)*

### Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL + JWT secrets
npm install
npm run migrate:up          # runs db/migrations/001_init.sql
npm run db:seed             # inserts demo users, projects, tasks
npm run dev                 # http://localhost:4000
```

```bash
curl http://localhost:4000/api/v1/health
# → { "success": true, "data": { "ok": true } }
```

### Frontend

```bash
cd frontend
# .env.local points NEXT_PUBLIC_API_URL at localhost:4000 by default
npm install
npm run dev                 # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) and click **Use demo account**.

---

## Deploying to Vercel

Two separate Vercel projects from the same repo, each with a different **Root Directory**.

### 1 · Database

Create a free [Neon](https://neon.tech) project and copy the **Pooled** connection string  
(`postgresql://…?sslmode=require`). Alternatively, add Neon directly from the Vercel Marketplace — it auto-provisions `DATABASE_URL`.

### 2 · Backend project

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Framework Preset | *Other* (leave blank) |

**Environment variables** (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon pooled connection string |
| `JWT_ACCESS_SECRET` | Random 64-char hex — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | A *different* random 64-char hex string |
| `CORS_ORIGIN` | Your frontend URL (add after Step 3, then redeploy) |

**Run migrations after the first successful deploy:**

```bash
DATABASE_URL="<neon-url>" npm run migrate:up   # from backend/
DATABASE_URL="<neon-url>" npm run db:seed
```

### 3 · Frontend project

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Framework Preset | *Next.js* (auto-detected) |

**Environment variables:**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<your-backend>.vercel.app/api/v1` |

### 4 · Wire CORS

Back in the **backend** Vercel project, set `CORS_ORIGIN` to your frontend URL and redeploy.

### 5 · Verify

```
https://<frontend>.vercel.app  →  login  →  dashboard KPIs load  ✓
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Notes |
|----------|:--------:|---------|-------|
| `DATABASE_URL` | ✅ | — | Postgres connection string with `?sslmode=require` |
| `JWT_ACCESS_SECRET` | ✅ | — | Random secret for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | — | Random secret for refresh tokens (different from above) |
| `CORS_ORIGIN` | | `http://localhost:3000` | Frontend URL; comma-separate multiple origins |
| `ACCESS_TOKEN_TTL` | | `15m` | |
| `REFRESH_TOKEN_TTL` | | `7d` | |
| `PORT` | | `4000` | Local dev only — Vercel ignores this |
| `MAX_ATTACHMENT_BYTES` | | `5242880` | 5 MB file-upload cap |

### Frontend (`frontend/.env.local`)

| Variable | Required | Notes |
|----------|:--------:|-------|
| `NEXT_PUBLIC_API_URL` | ✅ | Full backend URL including `/api/v1` |

---

## RBAC

| Permission | Admin | PM | Team Member |
|-----------|:-----:|:--:|:-----------:|
| Create / delete projects | ✅ | ✅ | — |
| Create / delete tasks | ✅ | ✅ | — |
| Manage project members | ✅ | ✅ | — |
| Comment & upload files | ✅ | ✅ | ✅ |
| Change visibility setting | ✅ | — | — |
| View all projects & tasks | ✅ | ✅ | Setting-dependent |

**Team Member visibility** (Admin → Settings):
- `ASSIGNED_ONLY` — TMs see only projects/tasks assigned to them
- `ALL` — TMs see everything (read-only on projects)

---

## Project structure

```
SMart HR/
├── backend/
│   ├── api/index.ts               # Vercel Function entry — exports Express app
│   ├── db/
│   │   ├── migrations/001_init.sql
│   │   ├── seed.ts
│   │   └── pool.ts
│   └── src/
│       ├── config/env.ts
│       ├── lib/                   # query · validate · errors · jwt · paginate · response
│       ├── middleware/            # auth · rbac · error · validate
│       └── modules/
│           ├── auth/              # signup · login · demo-login · refresh · me · logout
│           ├── projects/          # CRUD · soft-delete · restore
│           ├── tasks/             # CRUD · status workflow · soft-delete · restore
│           ├── members/           # membership · workload
│           ├── comments/          # threaded task comments
│           ├── attachments/       # upload/download · BYTEA · 5 MB cap
│           ├── activity/          # audit log feed
│           ├── analytics/         # dashboard KPIs + chart aggregations
│           ├── notifications/     # in-app notifications · unread count
│           └── settings/          # admin visibility toggle
│
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/            # login · signup
        │   └── (app)/             # dashboard · projects · tasks · members
        │       │                  # notifications · settings
        │       └── AppShell.tsx   # sidebar · topbar · RBAC-aware nav
        ├── components/            # DataTable · KpiCard · StatusBadge · ConfirmDialog · Logo
        ├── features/              # per-feature api.ts + hooks.ts + components
        └── lib/                   # fetch client · auth context · TanStack Query
```