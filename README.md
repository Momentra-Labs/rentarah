# RentaraH — customer marketplace (Web)

React + Vite + TypeScript + MUI frontend for a Philippines-focused peer-to-peer vehicle rental experience (cars and two-wheelers).

This repository is the **customer Web SPA** only. Backend and Admin live in sibling repos:

| Repo | Role | Local port |
|------|------|------------|
| **This repo** | Customer marketplace | `5173` |
| [`rentarah-api`](../rentarah-api) (sibling clone) | Express + Prisma API | `5000` |
| [`rentarah-admin`](../rentarah-admin) (sibling clone) | Operations console | `5174` |

**How to run everything:** **[docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)**  
Also: [docs/repository-separation.md](./docs/repository-separation.md) · [docs/SEPARATION_REPORT.md](./docs/SEPARATION_REPORT.md)

---

## Quick start (Web only)

```powershell
cd C:\Projects\rentahub2026.github.io
copy .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**. Mocks are on by default (`VITE_USE_MOCK=true`) — API not required.

For **Web + API + Admin** (three terminals), follow **[docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)**.
---

## Staging vs production

Full variable list: **[docs/ENVIRONMENTS.md](./docs/ENVIRONMENTS.md)**.

---

## NPM scripts

| Script | Description |
|--------|-------------|
| **`npm install`** / **`npm run setup`** | Install Web dependencies |
| **`npm run build`** | Production frontend build |
| **`npm run build:staging`** | Staging frontend build |
| **`npm run dev`** | Vite development |
| **`npm run typecheck`** | TypeScript check |
| **`npm run lint`** | ESLint |
| **`npm test`** | Vitest |

Architecture: **[docs/architecture.md](./docs/architecture.md)**. Changelog: **[docs/CHANGELOG.md](./docs/CHANGELOG.md)**.

---

## Frontend environment

| File (template) | When |
|-----------------|------|
| `.env.example` → `.env` | Local **`npm run dev`** |
| `.env.staging.example` → `.env.staging` | Staging mode |
| `.env.production.example` → `.env.production` | Production bundle |

Key variables:

- **`VITE_API_URL`** — API base **including `/api`** (e.g. `http://localhost:5000/api`). Required when `VITE_USE_MOCK=false`.
- **`VITE_USE_MOCK`** — `true` uses in-browser mocks (default for Pages-friendly demos).
- **`VITE_STRIPE_KEY`**, **`VITE_FIREBASE_*`**, **`VITE_BASE`** — see `.env.example`.

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md) | **How to run** Web / API / Admin locally |
| [docs/repository-separation.md](./docs/repository-separation.md) | How Web / API / Admin split |
| [docs/ENVIRONMENTS.md](./docs/ENVIRONMENTS.md) | Env matrix |
| [docs/API_AND_DATA_REQUIREMENTS.md](./docs/API_AND_DATA_REQUIREMENTS.md) | Client HTTP contracts (canonical copies also in rentarah-api) |
| [docs/API_IMPLEMENTATION_BACKLOG.md](./docs/API_IMPLEMENTATION_BACKLOG.md) | Future API work |

---

## Deploy

GitHub Pages deploys **this Web SPA only** (see `.github/workflows/`). The API must run on a Node host; Admin is a separate static site.
