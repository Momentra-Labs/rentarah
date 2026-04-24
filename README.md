# Rentara — car rental marketplace (frontend)

React + Vite + TypeScript + MUI demo for a Philippines-focused peer-to-peer vehicle rental experience (cars and two-wheelers). Catalog, search, maps, booking flow, host dashboard, and auth are implemented; **most booking and auth persistence is local** until a backend is connected.

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/API_AND_DATA_REQUIREMENTS.md](./docs/API_AND_DATA_REQUIREMENTS.md) | **HTTP paths the app uses**, `Car`/listing JSON fields, availability & booking payloads, search parameters, and what is still client-only |
| [docs/DATA_MODEL_AND_ARCHITECTURE.md](./docs/DATA_MODEL_AND_ARCHITECTURE.md) | PostgreSQL-oriented entities, relationships, payments, reviews, scalability notes |

## Environment

Copy `.env.example` to `.env`, then adjust:

- **`VITE_API_URL`** — API base URL (no trailing slash). Required when `VITE_USE_MOCK=false`.
- **`VITE_USE_MOCK`** — `true` uses `src/services/mockApi.ts`. Set to **`false`** to call the backend.
- **`VITE_STRIPE_KEY`** — Stripe **publishable** test key when exercising checkout UI.

## Scripts

```bash
npm install
npm run dev      # dev server
npm run build    # typecheck + production bundle
npm run preview  # serve dist
npm run lint
```

## Key source locations

- **Types:** `src/types/index.ts`
- **HTTP:** `src/services/apiClient.ts`, `vehicleService.ts`, `bookingService.ts`
- **Catalog + host edits:** `src/store/useCarsStore.ts`
- **Search (in-memory):** `src/services/listingSearchService.ts`
