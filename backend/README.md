# Rentara API (Express + Prisma)

Backend service for the Rentara marketplace. It lives in `/backend` and is independent from the Vite frontend.

**Monorepo:** from the repo root, use **`npm run setup`** (install root + backend) and **`npm run build:all`** (build both). See the [root README](../README.md).

## Stack

- **Node.js** (18+), **TypeScript**, **Express**
- **Prisma** + **PostgreSQL** for data and migrations
- **helmet**, **cors**, **dotenv** for security and configuration

## Prerequisites

- PostgreSQL running locally or reachable via connection string
- Node.js 18+

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL instance
npm install
```

## Database & migrations (Artisan-style workflow)

Schema lives in `prisma/schema.prisma`. After you change models:

```bash
npm run db:migrate
```

This runs **`prisma migrate dev`**, which:

1. Compares your schema to the database
2. Creates a new SQL migration under `prisma/migrations/` when needed
3. Applies pending migrations so the **live DB matches the schema**

Name migrations when prompted, or pass a name:

```bash
npx prisma migrate dev --name add_user_table
```

Other useful commands:

| Script            | Command              | Purpose                    |
|-------------------|----------------------|----------------------------|
| `npm run db:migrate` | `prisma migrate dev` | Dev migrations + apply     |
| `npm run db:migrate:deploy` | `prisma migrate deploy` | **Production:** apply committed migrations only |
| `npm run db:generate`| `prisma generate`    | Regenerate Prisma Client   |
| `npm run db:studio`  | `prisma studio`      | Browse data in the browser |
| `npm run db:push`    | `prisma db push`     | Prototype without migration files (avoid in shared envs) |

## Run the server

Default port is **5000** (override with `PORT` in `.env`).

`APP_ENV` selects optional `backend/.env.${APP_ENV}` after loading `.env` / `.env.local`. See [docs/ENVIRONMENTS.md](../docs/ENVIRONMENTS.md).

```bash
# development (watch)
npm run dev

# staging (watch, loads .env.staging when used with APP_ENV=staging)
npm run dev:staging

# production build
npm run build
npm start

# compiled process with explicit env (local smoke tests)
npm run start:staging
npm run start:production
```

## Verify the API

With the server running:

```bash
curl http://localhost:5000/api/health
```

Expect JSON: `{ "ok": true, "message": "Hello World — Rentara API is live", ... }`.

## Project layout

```
backend/
├── prisma/
│   └── schema.prisma      # User & future models (source of truth)
├── src/
│   ├── config/
│   ├── controllers/
│   ├── lib/                 # prisma client, HttpError, etc.
│   ├── middleware/
│   ├── models/              # Docs + type re-exports; schema is under prisma/
│   ├── routes/
│   └── server.ts
├── package.json
├── tsconfig.json
├── README.md
└── DEPLOYMENT.md
```

## Frontend alongside this repo

Run the API on **:5000** and point the Vite app at `http://localhost:5000` (e.g. `VITE_API_URL`) when you add HTTP clients. Keep CORS in mind: set `CORS_ORIGIN` in production to explicit origins.

## Deployment (GitHub Pages + future server)

**GitHub Pages only hosts the static frontend**; it cannot run this Node API. When you use a VPS or PaaS for the backend, see **[DEPLOYMENT.md](./DEPLOYMENT.md)** for environment variables, `prisma migrate deploy`, CORS, and a production checklist.
