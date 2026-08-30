# Repository separation report

**Date:** 2026-08-30  
**Epic:** Extract `backend/` → **rentarah-api**, `admin/` → **rentarah-admin**; keep this repo as customer **Web**.

---

## 1. Current architecture (before)

Monorepo with three npm packages and no cross-imports:

- Web (root `src/`) — Vite SPA, mock-first
- `backend/` — Express + Prisma + Firebase Admin (health + `/auth/me` only)
- `admin/` — Vite ops UI (env unlock + demo data)

## 2. New architecture

```text
rentahub2026.github.io (Web) ──HTTPS──► rentarah-api ──► PostgreSQL
rentarah-admin               ──HTTPS──► rentarah-api ──► PostgreSQL
```

| App | Location on disk | Port |
|-----|------------------|------|
| Web | `C:\Projects\rentahub2026.github.io` | 5173 |
| API | `C:\Projects\rentarah-api` | 5000 |
| Admin | `C:\Projects\rentarah-admin` | 5174 |

Admin has **no** `DATABASE_URL`. All durable data must flow through the API.

## 3. Files moved

### → rentarah-api (from `backend/`)

- `src/` (config, controllers, lib, middleware, routes, models, types, server)
- `prisma/schema.prisma`
- `.env*.example`, `.gitignore`, `package.json`, `tsconfig.json`
- `DEPLOYMENT.md`, `README.md`
- New: `docs/*`, `scripts/smoke.ts`, `/api/v1` mount aliases

### → rentarah-admin (from `admin/`)

- Full Vite app (`src/`, `index.html`, configs)
- New: `src/api/client.ts`, `src/api/health.ts`, `ApiHealthBanner`, `README.md`, `docs/api-client.md`
- `@types/node` for typecheck

### Removed from Web repo

- `backend/`
- `admin/`

## 4. Files changed (Web)

| File | Why |
|------|-----|
| `README.md` | Web-only quick start; sibling clone instructions |
| `package.json` | Dropped `--prefix backend/admin` scripts |
| `docs/architecture.md` | Three-repo topology |
| `docs/ENVIRONMENTS.md` | Point API/Admin env to siblings |
| `docs/repository-separation.md` | Migration map |
| `.env.example` (+ staging/prod) | `VITE_API_URL=…/api` convention |

## 5. API endpoints

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/health` | Unchanged |
| `GET` | `/api/v1/health` | Alias |
| `GET` | `/api/auth/me` | Firebase Bearer; 401 without token |
| `GET` | `/api/v1/auth/me` | Alias |

No vehicles/bookings/admin CRUD added (backlog remains).

## 6. Environment variables (names only)

### API

`APP_ENV`, `NODE_ENV`, `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`

### Admin

`VITE_ADMIN_UNLOCK`, `VITE_API_URL`, `VITE_MARKETPLACE_ORIGIN`, `VITE_BASE`  
(No database credentials.)

### Web

`VITE_APP_ENV`, `VITE_API_URL`, `VITE_USE_MOCK`, `VITE_STRIPE_KEY`, `VITE_BASE`, `VITE_ALLOW_LOCAL_AUTH`, `VITE_FIREBASE_*`, `VITE_ID_VERIFICATION_INSTANT_APPROVE`

## 7. Breaking changes

| Change | Impact | Mitigation |
|--------|--------|------------|
| `backend/` / `admin/` removed from this clone | `npm run dev:backend` / `dev:admin` gone | Clone siblings; see README |
| `VITE_API_URL` should include `/api` | Paths like `/vehicles` resolve under `/api` | Updated `.env*.example` |
| Admin bookings/ID still demo | Ops mutations not durable | Documented; backlog |

GitHub remotes for `rentarah-api` / `rentarah-admin` were **not** created on GitHub in this epic — local sibling git repos were initialized. Push when ready:

```bash
# example
cd ../rentarah-api
gh repo create rentahub2026/rentarah-api --private --source=. --remote=origin --push
```

## 8. Testing results

| Check | Result |
|-------|--------|
| `rentarah-api` `npm run build` | Passed |
| `rentarah-api` `npm run smoke` (health + auth/me 401, v1 aliases) | Passed |
| `rentarah-admin` `npm run typecheck` | Passed (after `@types/node`) |
| Web `typecheck` / `lint` / `test` | Passed (8 tests) |

## 9. Remaining work

1. Push sibling repos to GitHub (or Cursor Origin) and update README absolute links.
2. Implement API backlog (vehicles, bookings, admin routes) in **rentarah-api**.
3. Wire Admin bookings/verification to Admin API; replace `VITE_ADMIN_UNLOCK` with Firebase admin claims verified by API.
4. Point production CORS at real Web + Admin origins.
5. Optional: `git filter-repo` history import if full path history is required beyond the extract commit.
