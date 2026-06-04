# IndiHive

IndiHive is a production-grade team collaboration platform — Trello-style boards plus a Slack-style chat, organized per organization — built with **Next.js 14 + Node.js + MongoDB** and real-time collaboration via Socket.IO.

> Status: **Phase 0 — Scaffolding complete.** Subsequent phases come online incrementally.

## Stack

- **Backend:** Node 20, TypeScript, Express, Mongoose, JWT, Zod, Socket.IO, BullMQ, Pino, Vitest
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand, `@hello-pangea/dnd`, Framer Motion
- **Infra:** MongoDB 7, Redis 7, Docker Compose, GitHub Actions, Vercel + Railway/Render

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Boot MongoDB + Redis
docker compose up -d mongo mongo-express redis

# 4. Run dev servers (backend on :4000, frontend on :3000)
pnpm dev
```

- Frontend: <http://localhost:3000>
- Backend health: <http://localhost:4000/api/health>
- Mongo admin (mongo-express): <http://localhost:8081> (admin/admin)

## Repository layout

```
indihive/
├── backend/    Express + Mongoose API
├── frontend/   Next.js 14 App Router UI
├── shared/     Cross-package TS types
├── .github/    CI/CD workflows
└── docker-compose.yml
```

## Scripts (root)

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Run backend + frontend in parallel             |
| `pnpm dev:backend`  | Backend only                                   |
| `pnpm dev:frontend` | Frontend only                                  |
| `pnpm build`        | Build all packages                             |
| `pnpm lint`         | Lint all packages                              |
| `pnpm typecheck`    | Typecheck all packages                         |
| `pnpm test`         | Run tests across packages                      |
| `pnpm seed`         | Seed demo workspace + boards (`demo@indihive.app` / `demo1234`) |

## Phase plan

- [x] **Phase 0** — Monorepo scaffolding, Docker, tooling, CI placeholders
- [ ] **Phase 1** — Backend foundation + email/password auth
- [ ] **Phase 2** — Domain models + REST API (workspaces, boards, lists, cards, …)
- [ ] **Phase 3** — Realtime, file uploads, email, search, Butler automation
- [ ] **Phase 4** — Frontend foundation: app shell, auth pages, theming
- [ ] **Phase 5** — Board view + card modal + drag-and-drop
- [ ] **Phase 6** — Alternate views: calendar, timeline, table, dashboard, map
- [ ] **Phase 7** — Inbox, planner, templates, search, notifications, settings
- [ ] **Phase 8** — CI/CD pipelines, branch protection, Dependabot
- [ ] **Phase 9** — A11y, performance, landing page, seed data

## Branch protection (recommended)

Once pushed to GitHub:

1. Settings → Branches → Add rule for `main`
2. Require PR before merging
3. Require status checks: `backend-ci`, `frontend-ci`
4. Restrict force-pushes

## License

MIT (placeholder — update before public release).
