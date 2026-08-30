# Local development — how to run RentaraH

After repository separation you need **up to three folders** side by side:

```text
C:\Projects\
  rentahub2026.github.io   ← Web (customer marketplace)
  rentarah-api             ← API
  rentarah-admin           ← Admin console
```

| App | Folder | URL when running |
|-----|--------|------------------|
| Web | `rentahub2026.github.io` | http://localhost:5173 |
| API | `rentarah-api` | http://localhost:5000 |
| Admin | `rentarah-admin` | http://localhost:5174 |

**Requirements:** Node.js 18+, npm. PostgreSQL only if you exercise real API/DB features (health check works without a populated DB).

---

## Option A — Web only (fastest)

Use this for UI work. Data comes from in-browser mocks.

```powershell
cd C:\Projects\rentahub2026.github.io
copy .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**.

Leave `VITE_USE_MOCK=true` in `.env` (default).

---

## Option B — Full stack (Web + API + Admin)

Open **three terminals**.

### 1) API

```powershell
cd C:\Projects\rentarah-api
copy .env.example .env
# Edit .env: set DATABASE_URL if you use Prisma; optional CORS_ORIGIN=http://localhost:5173,http://localhost:5174
npm install
npm run dev
```

Check:

```powershell
curl http://localhost:5000/api/health
# or: npm run smoke   (with API still running)
```

### 2) Admin

```powershell
cd C:\Projects\rentarah-admin
copy .env.example .env
# Confirm in .env:
#   VITE_ADMIN_UNLOCK=true
#   VITE_API_URL=http://localhost:5000/api
#   VITE_MARKETPLACE_ORIGIN=http://localhost:5173
npm install
npm run dev
```

Open **http://localhost:5174**.  
If unlock fails, set `VITE_ADMIN_UNLOCK=true` and restart `npm run dev`.

### 3) Web

```powershell
cd C:\Projects\rentahub2026.github.io
copy .env.example .env   # if you have not already
npm install
npm run dev
```

Open **http://localhost:5173**.

#### Talk to the real API from Web (optional)

In `rentahub2026.github.io\.env`:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
```

Restart `npm run dev`.  
Note: catalog/booking HTTP routes are still mostly backlog — many screens need mocks until those APIs ship. Prefer mocks for day-to-day Web UI work.

---

## Useful commands

### Web (`rentahub2026.github.io`)

| Command | What it does |
|---------|----------------|
| `npm run dev` | Dev server `:5173` |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |

### API (`rentarah-api`)

| Command | What it does |
|---------|----------------|
| `npm run dev` | API watch mode `:5000` |
| `npm run build` | Compile TypeScript |
| `npm run smoke` | Health + `/auth/me` 401 checks |
| `npm run db:migrate` | Prisma migrate (needs `DATABASE_URL`) |

### Admin (`rentarah-admin`)

| Command | What it does |
|---------|----------------|
| `npm run dev` | Dev server `:5174` |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Admin shows “Admin locked” | Set `VITE_ADMIN_UNLOCK=true` in `rentarah-admin\.env`, restart Vite |
| Admin “API unreachable” | Start `rentarah-api`; set `VITE_API_URL=http://localhost:5000/api` |
| Web blank / wrong API | Confirm `VITE_API_URL` includes `/api` (not bare `:5000`) |
| Port already in use | Stop the other process, or change `PORT` (API) / Vite `server.port` |
| Sibling folder missing | Re-clone or copy from extract; see [SEPARATION_REPORT.md](./SEPARATION_REPORT.md) |

---

## Related docs

- [ENVIRONMENTS.md](./ENVIRONMENTS.md) — env variable matrix  
- [repository-separation.md](./repository-separation.md) — why three repos  
- [SEPARATION_REPORT.md](./SEPARATION_REPORT.md) — what moved where  
- Root [README.md](../README.md) — Web overview  
