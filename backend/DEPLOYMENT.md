# Deploying the Rentara API

This document explains how to run this Express + Prisma backend in production when you move off **GitHub Pages** for the frontend only.

## Why the API cannot live on GitHub Pages

**GitHub Pages serves static files** (HTML, JS, CSS, assets). It does not run Node.js, cannot execute your Express server, and cannot host PostgreSQL. Your **Vite/React frontend** can stay on Pages (or any static host); the **API must run somewhere that executes Node** and can reach a real **PostgreSQL** database.

When you provision a **VPS, container host, or PaaS**, use this guide to configure and deploy the `backend/` app.

---

## What you need in production

| Requirement | Notes |
|-------------|--------|
| **Node.js** | 18+ (match `engines` in `package.json`). |
| **PostgreSQL** | Managed DB (RDS, Supabase, Neon, etc.) or Postgres on the same VPS. |
| **Environment variables** | At minimum `DATABASE_URL`, `NODE_ENV=production`. See below. |
| **Build step** | `npm ci` (or `npm install`) then `npm run build`. |
| **Start command** | `npm start` → runs `node dist/server.js`. |
| **Migrations** | Run **`npm run db:migrate:deploy`** on each release **before** or **as part of** starting the new version (see [Database migrations](#database-migrations-production-vs-development)). |

---

## Environment variables

Copy from `.env.example` and set real values on the server (never commit `.env`).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL URL, e.g. `postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public`. Use SSL query params if your provider requires them. |
| `NODE_ENV` | Recommended | Set to `production` so less verbose logging and stricter error responses. |
| `PORT` | Optional | Defaults to **5000**. Many hosts inject `PORT` automatically; your process must listen on `process.env.PORT`. |
| `CORS_ORIGIN` | **Yes in production** | Comma-separated list of allowed browser origins (your frontend URL(s)), e.g. `https://yourname.github.io,https://www.yourdomain.com`. **Do not** rely on wide-open CORS in production. |

Example production `.env` (values are illustrative):

```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@db.example.com:5432/rentara?schema=public&sslmode=require"
CORS_ORIGIN="https://yourname.github.io,https://app.yourdomain.com"
```

---

## Database migrations (production vs development)

| Command | When to use |
|---------|-------------|
| `npm run db:migrate` | **Local development** — runs `prisma migrate dev`; creates migration files and applies them. |
| `npm run db:migrate:deploy` | **Production / CI** — runs `prisma migrate deploy`; applies **existing** migrations from `prisma/migrations/` only; does not prompt or create new files. |

**Release checklist:**

1. Commit migration folders generated in dev (`prisma/migrations/...`).
2. On the server (or in your deploy pipeline): install deps, `npm run build`, then **`npm run db:migrate:deploy`**, then **`npm start`** (or restart the process manager).

If `migrate deploy` fails, fix the DB or migration state before routing traffic to the new build.

---

## Typical deploy flow (any Node host)

```bash
cd backend
npm ci
npm run build
npm run db:migrate:deploy
npm start
```

Ensure `DATABASE_URL` and other variables are set in the host’s environment (dashboard, systemd, Docker, etc.), not only in a local file, unless you copy a secured `.env` onto the server.

**Health check:** after deploy, call `GET https://your-api-host/api/health` (or `http://IP:PORT/api/health` during testing).

---

## Listening address and reverse proxy

The app listens on **`PORT`** (default 5000) on all interfaces (`app.listen(port)`). Common patterns:

1. **Process listens on `127.0.0.1:5000`** — only reachable on the machine; put **Nginx** or **Caddy** in front on `:443` with TLS and `proxy_pass` to the Node port.
2. **Host sets `PORT`** — e.g. PaaS assigns a random port; the app already uses `env.port`.

For a **VPS**, terminate HTTPS at the reverse proxy and set `CORS_ORIGIN` to your real `https://` frontend URLs.

---

## Optional: process manager (VPS)

To survive restarts and crashes, run Node under **PM2**, **systemd**, or your platform’s native “worker”:

```bash
# Example: PM2
npm run build
pm2 start dist/server.js --name rentara-api
pm2 save
```

Run `db:migrate:deploy` **before** `pm2 restart` when you ship schema changes.

---

## Hosting options (short)

- **VPS** (DigitalOcean, Linode, AWS EC2, etc.): full control; you install Node, Postgres or use a managed DB, Nginx, and PM2/systemd.
- **PaaS** (Railway, Render, Fly.io, etc.): connect a Git repo or Docker image; set env vars; use their Postgres addon or external `DATABASE_URL`.
- **Containers**: build an image that runs `npm ci`, `npm run build`, then `migrate deploy` + `node dist/server.js` (entrypoint script often wraps migrate + start).

The exact clicks differ by provider; the **configuration surface** is always: **Node version**, **`DATABASE_URL`**, **`NODE_ENV`**, **`PORT`**, **`CORS_ORIGIN`**, **build**, **migrate deploy**, **start**.

---

## Frontend on GitHub Pages + API on a server

1. Deploy static site to Pages as you do today.
2. Set frontend env (e.g. `VITE_API_URL`) to your **public API base URL** (e.g. `https://api.yourdomain.com`).
3. Set backend `CORS_ORIGIN` to your Pages URL (e.g. `https://<user>.github.io` or custom domain).
4. Use **HTTPS** for both when possible.

---

## Security checklist before go-live

- [ ] `NODE_ENV=production`
- [ ] Strong, unique `DATABASE_URL` credentials; DB not exposed publicly without firewall rules
- [ ] `CORS_ORIGIN` restricted to real frontend origins
- [ ] Secrets only in host env / secret manager — not in Git
- [ ] TLS on the public API (proxy or host-managed)
- [ ] Run `npm run db:migrate:deploy` as part of deploy; verify health endpoint

---

## Related

- Local setup and dev migrations: [README.md](./README.md)
- Example env keys: [.env.example](./.env.example)
