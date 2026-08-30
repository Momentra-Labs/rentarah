# Staging and production environments

This **Web** repo supports **development**, **staging**, and **production** Vite modes. The API and Admin are **sibling repositories** with their own env files.

| App | Repo | Env docs |
|-----|------|----------|
| Web | this repo | below |
| API | `rentarah-api` | that repo’s `.env*.example` + `docs/deployment.md` |
| Admin | `rentarah-admin` | that repo’s `.env.example` |

## Frontend (this repo)

Vite loads env files in this order for a given **mode** (`development` | `staging` | `production`):

1. `.env` — shared defaults (all modes)
2. `.env.local` — local overrides (gitignored)
3. `.env.[mode]` — e.g. `.env.staging`, `.env.production`
4. `.env.[mode].local` — optional (gitignored)

Only variables prefixed with **`VITE_`** are exposed to the browser.

| Variable | Purpose |
|----------|---------|
| `VITE_APP_ENV` | `development` / `staging` / `production` |
| `VITE_API_URL` | API base **including `/api`**, no trailing slash (e.g. `http://localhost:5000/api`) |
| `VITE_USE_MOCK` | `true` = mock API; `false` = real `VITE_API_URL` |
| `VITE_STRIPE_KEY` | Publishable key (test in dev/staging, live in production) |
| `VITE_BASE` | Vite `base` for GitHub Pages paths |
| `VITE_FIREBASE_*` | Client Firebase Auth |
| `VITE_ALLOW_LOCAL_AUTH` | Local demo auth gate (never enable in public production) |

**Templates:** `.env.example`, `.env.staging.example`, `.env.production.example`.

### Scripts (repo root)

| Command | Mode | Typical use |
|---------|------|-------------|
| `npm run dev` | `development` | Local UI against mock or local API |
| `npm run dev:staging` | `staging` | Local UI pointed at staging API |
| `npm run build` | `production` | Production bundle |
| `npm run build:staging` | `staging` | Staging bundle |

In **CI**, set the same `VITE_*` variables in the build environment instead of committing secrets.

---

## API (`rentarah-api` sibling)

Clone and configure separately. Key variables (names only): `APP_ENV`, `NODE_ENV`, `DATABASE_URL`, `PORT`, `CORS_ORIGIN` (Web + Admin origins), `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`.

```bash
cd ../rentarah-api
npm run dev                 # :5000
npm run smoke               # health + auth/me checks
```

Admin must **never** receive `DATABASE_URL`.

---

## Admin (`rentarah-admin` sibling)

| Variable | Purpose |
|----------|---------|
| `VITE_ADMIN_UNLOCK` | Local UI unlock (`true` to open) |
| `VITE_API_URL` | Same convention as Web (`…/api`) |
| `VITE_MARKETPLACE_ORIGIN` | Customer web origin for deep links |

---

## Quick matrix

| Concern | Development | Staging | Production |
|--------|-------------|---------|------------|
| Web | `npm run dev` | `npm run build:staging` | `npm run build` (Pages) |
| API | `npm run dev` in rentarah-api | host + staging secrets | host + prod secrets |
| Admin | `npm run dev` in rentarah-admin | static staging host | static prod host |
| Stripe (Web) | Test keys | Usually test | Live keys |
| Database | Only on API | Staging Postgres | Production Postgres |

---

## Related

- [README.md](../README.md)
- [repository-separation.md](./repository-separation.md)
- Sibling: `rentarah-api/docs/deployment.md`
