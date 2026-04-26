# Rentara — car rental marketplace

React + Vite + TypeScript + MUI frontend for a Philippines-focused peer-to-peer vehicle rental experience (cars and two-wheelers). Catalog, search, maps, booking flow, host dashboard, and auth are implemented; **most booking and auth persistence is local** until the backend is fully wired.

An **Express + Prisma + PostgreSQL API** lives in **`/backend`** (separate `package.json`). This repo is a **monorepo**: one Git clone, two install targets.

---

## Quick start (full repo)

Run these from the **repository root** (no `cd` into `backend` for installs or combined builds).

| Step | Command | What it does |
|------|---------|----------------|
| 1. Install everything | **`npm run setup`** | Same as `npm run install:all` — runs `npm install` at the root **and** `npm install` in `backend/` (includes Prisma client generation). |
| 2. Environment | Copy env files | Root: `.env.example` → `.env`. Staging/prod UI: `.env.staging.example` / `.env.production.example`. Backend: `backend/.env.example` → `backend/.env` (+ staging/prod templates in `backend/`). |
| 3. Build frontend + API | **`npm run build:all`** | Production-mode frontend + backend `tsc`. Use **`npm run build:all:staging`** for a staging UI bundle. |
| 4. Dev — frontend only | **`npm run dev`** | Vite **development** mode. Use **`npm run dev:staging`** for staging env files. |
| 5. Dev — API only | **`npm run dev:backend`** | Express on **port 5000**. **`npm run dev:backend:staging`** for `APP_ENV=staging`. |

**Fresh clone / CI checklist**

```bash
npm run setup
npm run build:all
```

Optional checks:

```bash
curl http://localhost:5000/api/health   # after starting the backend
```

---

## Staging vs production

Full variable list, Vite modes, and `APP_ENV` for the API are in **[docs/ENVIRONMENTS.md](./docs/ENVIRONMENTS.md)**.

---

## NPM scripts (root `package.json`)

| Script | Description |
|--------|-------------|
| **`npm run setup`** | Install root + `backend` dependencies (alias for `install:all`). |
| **`npm run install:all`** | `npm install && npm install --prefix backend`. |
| **`npm run build:all`** | **Production** frontend + backend compile. |
| **`npm run build:all:staging`** | **Staging** frontend + backend compile. |
| **`npm run build`** | Frontend **production** build (`vite build --mode production`). |
| **`npm run build:staging`** | Frontend **staging** build. |
| **`npm run build:production`** | Same as **`npm run build`**. |
| **`npm run build:backend`** | Backend `tsc` only (`--prefix backend`). |
| **`npm run dev`** | Vite **development** mode. |
| **`npm run dev:staging`** | Vite **staging** mode (uses `.env.staging`). |
| **`npm run dev:backend`** | API **development** (`APP_ENV=development`). |
| **`npm run dev:backend:staging`** | API **staging** (`APP_ENV=staging`). |
| **`npm run preview`** | Serve frontend `dist/`. |
| **`npm run typecheck`** | Frontend TypeScript check only. |
| **`npm run lint`** | ESLint. |

---

## Backend (`/backend`)

| Doc | Contents |
|-----|----------|
| **[backend/README.md](./backend/README.md)** | API stack, Prisma migrations (`db:migrate`), local run, project layout. |
| **[backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md)** | Production deploy, env vars, `db:migrate:deploy`, CORS, GitHub Pages vs Node host. |

Common backend commands (from repo root):

```bash
npm run dev:backend                   # API dev (development)
npm run dev:backend:staging           # API dev (staging env files)
npm run build --prefix backend        # compile API
npm run db:migrate --prefix backend   # dev DB migrations (Prisma)
```

Staging/production process helpers (after `npm run build --prefix backend`):  
`npm run start:staging --prefix backend` · `npm run start:production --prefix backend`

---

## Frontend environment

| File (template) | When |
|-----------------|------|
| `.env.example` → `.env` | Local **`npm run dev`** (mode `development`) |
| `.env.staging.example` → `.env.staging` | **`npm run dev:staging`** / **`npm run build:staging`** |
| `.env.production.example` → `.env.production` | **`npm run build`** (production bundle) |

Variables:

- **`VITE_APP_ENV`** — `development` | `staging` | `production`
- **`VITE_API_URL`** — API base URL (no trailing slash). Required when `VITE_USE_MOCK=false`.
- **`VITE_USE_MOCK`** — `true` uses `src/services/mockApi.ts`. Set to **`false`** to call the backend.
- **`VITE_STRIPE_KEY`** — Stripe publishable key (test vs live per environment).
- **`VITE_BASE`** — see `vite.config.ts` (GitHub Pages project subpaths).

---

## Documentation (product & API shape)

| Doc | Contents |
|-----|----------|
| [docs/ENVIRONMENTS.md](./docs/ENVIRONMENTS.md) | **Staging / production** env files, `VITE_*`, `APP_ENV`, scripts matrix |
| [docs/API_AND_DATA_REQUIREMENTS.md](./docs/API_AND_DATA_REQUIREMENTS.md) | HTTP paths the app uses, `Car`/listing JSON, availability & booking payloads, search parameters, client-only behavior |
| [docs/DATA_MODEL_AND_ARCHITECTURE.md](./docs/DATA_MODEL_AND_ARCHITECTURE.md) | PostgreSQL-oriented entities, relationships, payments, reviews, scalability |

---

## Key source locations

- **Types:** `src/types/index.ts`
- **HTTP:** `src/services/apiClient.ts`, `vehicleService.ts`, `bookingService.ts`
- **Catalog + host edits:** `src/store/useCarsStore.ts`
- **Search (in-memory):** `src/services/listingSearchService.ts`
- **API server entry:** `backend/src/server.ts`
- **DB schema:** `backend/prisma/schema.prisma`
