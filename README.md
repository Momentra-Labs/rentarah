# Rentara — car rental marketplace

React + Vite + TypeScript + MUI frontend for a Philippines-focused peer-to-peer vehicle rental experience (cars and two-wheelers). Catalog, search, maps, booking flow, host dashboard, and auth are implemented; **most booking and auth persistence is local** until the backend is fully wired.

An **Express + Prisma + PostgreSQL API** lives in **`/backend`** (separate `package.json`). This repo is a **monorepo**: one Git clone, two install targets.

---

## Quick start (full repo)

Run these from the **repository root** (no `cd` into `backend` for installs or combined builds).

| Step | Command | What it does |
|------|---------|----------------|
| 1. Install everything | **`npm run setup`** | Same as `npm run install:all` — runs `npm install` at the root **and** `npm install` in `backend/` (includes Prisma client generation). |
| 2. Environment | Copy env files | Root: copy `.env.example` → `.env` for Vite. Backend: copy `backend/.env.example` → `backend/.env` when you run the API. |
| 3. Build frontend + API | **`npm run build:all`** | Frontend: `tsc --noEmit` + `vite build`. Backend: TypeScript compile to `backend/dist/`. |
| 4. Dev — frontend only | **`npm run dev`** | Vite dev server (default port from Vite). |
| 5. Dev — API only | **`npm run dev --prefix backend`** | Express with `tsx watch` on **port 5000** by default. |

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

## NPM scripts (root `package.json`)

| Script | Description |
|--------|-------------|
| **`npm run setup`** | Install root + `backend` dependencies (alias for `install:all`). |
| **`npm run install:all`** | `npm install && npm install --prefix backend`. |
| **`npm run build:all`** | Build **frontend** then **backend** in one go. |
| **`npm run build`** | Frontend production build only (`tsc --noEmit && vite build`). |
| **`npm run build:backend`** | Backend `tsc` only (`--prefix backend`). |
| **`npm run dev`** | Vite dev server. |
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
npm run dev --prefix backend          # API dev server
npm run build --prefix backend        # compile API
npm run db:migrate --prefix backend   # dev DB migrations (Prisma)
```

---

## Frontend environment

Copy **`.env.example`** to **`.env`** at the repo root, then adjust:

- **`VITE_API_URL`** — API base URL (no trailing slash). Required when `VITE_USE_MOCK=false`.
- **`VITE_USE_MOCK`** — `true` uses `src/services/mockApi.ts`. Set to **`false`** to call the backend.
- **`VITE_STRIPE_KEY`** — Stripe **publishable** test key when exercising checkout UI.

---

## Documentation (product & API shape)

| Doc | Contents |
|-----|----------|
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
