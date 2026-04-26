# Staging and production environments

This repo supports **development**, **staging**, and **production** for both the **Vite frontend** and the **Express backend**. Values are separate per environment (API URLs, Stripe keys, databases, CORS).

## Frontend (root)

Vite loads env files in this order for a given **mode** (`development` | `staging` | `production`):

1. `.env` — shared defaults (all modes)
2. `.env.local` — local overrides (gitignored)
3. `.env.[mode]` — e.g. `.env.staging`, `.env.production`
4. `.env.[mode].local` — optional (gitignored)

Only variables prefixed with **`VITE_`** are exposed to the browser.

| Variable | Purpose |
|----------|---------|
| `VITE_APP_ENV` | `development` / `staging` / `production` (for UI logic or banners) |
| `VITE_API_URL` | Backend base URL, no trailing slash |
| `VITE_USE_MOCK` | `true` = mock API; `false` = real `VITE_API_URL` |
| `VITE_STRIPE_KEY` | Publishable key (test in dev/staging, live in production) |
| `VITE_BASE` | Vite `base` for GitHub Pages paths (see root `vite.config.ts`) |

**Templates:** copy from `.env.example`, `.env.staging.example`, `.env.production.example`.

### Scripts (repo root)

| Command | Mode | Typical use |
|---------|------|-------------|
| `npm run dev` | `development` | Local UI against mock or local API |
| `npm run dev:staging` | `staging` | Local UI pointed at staging API |
| `npm run build` | `production` | Production bundle (same as `build:production`) |
| `npm run build:staging` | `staging` | Staging bundle |
| `npm run build:production` | `production` | Production bundle |
| `npm run build:all` | production frontend + backend `tsc` | Full production compile |
| `npm run build:all:staging` | staging frontend + backend `tsc` | Staging UI + API compile |

In **CI**, set the same `VITE_*` variables in the build environment for the branch (e.g. `develop` → staging, `main` → production) instead of committing `.env.production`.

---

## Backend (`/backend`)

The API resolves **`APP_ENV`**: `development` | `staging` | `production` (default `development`).

**File load order:**

1. `.env` — base (optional)
2. `.env.local` — local overrides (gitignored)
3. `.env.${APP_ENV}` — e.g. `.env.staging`, `.env.production` (overrides earlier keys)

`APP_ENV` is read **after** steps 1–2 so you can set it in `.env`. For **`npm run dev:staging`**, `cross-env` sets `APP_ENV=staging` before startup so `.env.staging` is loaded.

| Variable | Purpose |
|----------|---------|
| `APP_ENV` | `development` / `staging` / `production` |
| `NODE_ENV` | `development` or `production` (use `production` for optimized Node in staging/prod) |
| `DATABASE_URL` | Prisma / PostgreSQL (different DB per environment) |
| `PORT` | Listen port (default `5000`) |
| `CORS_ORIGIN` | Comma-separated frontend origins |

**Templates:** `backend/.env.example`, `backend/.env.staging.example`, `backend/.env.production.example`.

### Scripts (`backend/` or `npm run ... --prefix backend`)

| Command | Notes |
|---------|--------|
| `npm run dev` | `APP_ENV=development` (default) |
| `npm run dev:staging` | Staging env files + watch |
| `npm start` | Run compiled `dist/server.js` — set `APP_ENV` on the host |
| `npm run start:staging` | `NODE_ENV=production` + `APP_ENV=staging` |
| `npm run start:production` | `NODE_ENV=production` + `APP_ENV=production` |

**Migrations:** use the **same** migration folder for all environments; point each environment’s `DATABASE_URL` at the right database and run `npm run db:migrate:deploy` on deploy (see `backend/DEPLOYMENT.md`).

---

## Quick matrix

| Concern | Development | Staging | Production |
|--------|-------------|---------|------------|
| Frontend dev | `npm run dev` | `npm run dev:staging` | N/A (use built bundle) |
| Frontend build | — | `npm run build:staging` | `npm run build` |
| API dev | `npm run dev --prefix backend` | `npm run dev:staging --prefix backend` | — |
| API run (built) | — | `start:staging` + staging secrets | `start:production` + prod secrets |
| Stripe | Test keys | Usually test | Live keys |
| Database | Local Postgres | Staging instance | Production instance |

---

## Related

- [README.md](../README.md) — monorepo setup, `setup`, `build:all`
- [backend/DEPLOYMENT.md](../backend/DEPLOYMENT.md) — production deploy, CORS, migrations
