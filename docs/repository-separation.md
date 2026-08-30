# RentaraH repository separation

**Status:** Separation executed — see [SEPARATION_REPORT.md](./SEPARATION_REPORT.md). Sibling clones: `../rentarah-api`, `../rentarah-admin`.

**Constraint:** Separate packages without rewriting product logic. Do **not** implement the full API feature backlog as part of this epic ([API_IMPLEMENTATION_BACKLOG.md](./API_IMPLEMENTATION_BACKLOG.md)).

---

## 1. Current architecture (audit)

| Package | Path (pre-split) | Stack | Data |
|---------|------------------|-------|------|
| Web | repo root + `src/` | Vite React SPA | Mock by default (`VITE_USE_MOCK`); optional HTTP |
| API | `backend/` | Express + Prisma + Firebase Admin | PostgreSQL (`DATABASE_URL`) |
| Admin | `admin/` | Vite React + MUI | Demo fixtures; optional `GET /vehicles` |

There are **no** compile-time imports across the three packages. Coupling is HTTP and env only.

### Live API surface (today)

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/health` | none |
| `GET` | `/api/auth/me` | Firebase Bearer |

### Admin today

- Unlock: `VITE_ADMIN_UNLOCK=true` (UI only; not API-verified).
- Listings: optional HTTP catalog, else `demoCatalog`.
- Bookings / ID verification: in-memory demo only.
- **No** database credentials in Admin.

---

## 2. Target architecture

```text
rentahub2026.github.io (Web) ──HTTPS──► rentarah-api ──► PostgreSQL
rentarah-admin               ──HTTPS──► rentarah-api ──► PostgreSQL
```

Local ports:

| App | Port |
|-----|------|
| Web | `5173` |
| API | `5000` |
| Admin | `5174` |

---

## 3. Classification table

| Current file / module | Responsibility | Destination | Reason |
|-----------------------|----------------|-------------|--------|
| `backend/**` | Express API, Prisma, Firebase verify | **rentarah-api** | Only DB-owning service |
| `admin/**` | Ops UI | **rentarah-admin** | HTTP client only; no DB |
| `src/**`, `public/`, Pages workflow | Customer marketplace | **Web (this repo)** | Stay |
| `docs/API_*.md`, `DATA_MODEL_*` | API contracts | Primary copies in **API** docs; Web keeps pointers | Single source of truth |
| `docs/architecture.md` | System overview | Update in **Web**; summaries in API/Admin READMEs | Post-split topology |
| `src/repositories/*`, `mockApi*` | Client adapters / mocks | **Web** | Not server logic |
| `admin/src/data/demo*` | Temporary UI fixtures | **Admin** until Admin API exists | Explicitly temporary |
| Types (`Car` / `Vehicle`, bookings) | Duplicated DTOs | Remain duplicated | No shared package yet |
| `formatPeso` / theme blue | Presentation | Each frontend | Already duplicated |
| `.github/workflows/deploy-github-pages.yml` | Web static deploy | **Web** | API cannot run on Pages |

---

## 4. Dependencies

### API (`rentarah-api`)

Express, Prisma, PostgreSQL, firebase-admin, cors, helmet, dotenv, tsx/tsc.

Env (names only): `APP_ENV`, `NODE_ENV`, `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`.

### Admin (`rentarah-admin`)

React, MUI, React Router, Vite. **No** Prisma, Firebase Admin, or DB drivers.

Env (names only): `VITE_ADMIN_UNLOCK`, `VITE_API_URL`, `VITE_MARKETPLACE_ORIGIN`, `VITE_BASE`.

### Web (this repo)

React, MUI, TanStack Query, Zustand, Firebase client, Stripe.js, Leaflet, Vitest/Playwright.

Env (API-related): `VITE_API_URL`, `VITE_USE_MOCK`, plus Firebase/Stripe/`VITE_BASE` (see `.env.example`).

### Shared

None as an npm package. Sync DTO shapes via API docs.

**Shared-package policy:** Do **not** create a shared package in this epic.

---

## 5. URL convention

- Server mounts under `/api` and `/api/v1` (aliases for health + auth).
- When mocks are off, set Web/Admin:

```env
VITE_API_URL=http://localhost:5000/api
```

so client paths like `/vehicles` resolve to `http://localhost:5000/api/vehicles` once those routes ship. Prefer `/api/v1` for new feature routes.

---

## 6. Non-goals (this epic)

- Vehicle / Booking Prisma models and CRUD
- Stripe webhooks, uploads, cron, notifications workers
- Full Admin API (users, bookings moderation, verification persistence)
- Replacing Admin unlock with Firebase admin claims (document only)
- npm workspaces / shared DTO package
- Changing Web booking/auth business rules or forcing `VITE_USE_MOCK=false`

---

## 7. Extraction steps

1. Apply separation-safe changes in-tree (`backend/`, `admin/`).
2. Copy `backend/` → sibling `rentarah-api` (git init; preserve history via subtree/filter when available).
3. Copy `admin/` → sibling `rentarah-admin`.
4. Smoke: API health + auth/me 401; Admin unlock + health check.
5. Update Web README / architecture / scripts / env examples.
6. Remove `backend/` and `admin/` from this repo after smoke passes.
7. Publish final report in `docs/SEPARATION_REPORT.md`.

### Rollback

- Restore `backend/` and `admin/` from git history before the removal commit.
- Re-add root scripts that `--prefix` into those folders.

---

## 8. Future Admin API (document only)

When backlog lands, Admin should call (examples):

- `GET /api/v1/admin/dashboard`
- `GET|PATCH /api/v1/admin/vehicles`
- `GET|PATCH /api/v1/admin/bookings`
- `GET|PATCH /api/v1/admin/verification`

Until then, bookings/verification remain demo; listings use catalog HTTP or demo fallback.

---

## 9. Related docs

- [architecture.md](./architecture.md)
- [API_IMPLEMENTATION_BACKLOG.md](./API_IMPLEMENTATION_BACKLOG.md)
- [ENVIRONMENTS.md](./ENVIRONMENTS.md)
- Sibling repos (after extract): `rentarah-api`, `rentarah-admin`
