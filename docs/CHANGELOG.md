# Changelog

Notable architecture and migration changes for the RentaraH monorepo.

## Unreleased

Architecture migration Phases 0–9 landed in one incremental pass (routes/behavior preserved; shims at old paths).

### Phase 0 — Foundation

- Added [`docs/architecture.md`](./architecture.md) (current vs target architecture, layering, migration status).
- Configured `@/` path alias (Vite + TypeScript).
- Added Vitest + Testing Library; `npm test` / `npm run test:watch`.
- Smoke unit tests for currency formatting and listing search filters.

### Phase 1 — Scaffolding

- Moved app shell to `src/app/` with compatibility re-export from `src/App.tsx`.
- Introduced `src/repositories/` (vehicle/booking adapters) with service-layer re-exports.
- Removed unused dead code (`useFilteredCars`, landing map stubs, browse `DatePicker`).

### Phase 2 — Shared UI / DRY

- Single-sourced `DEFAULT_SEARCH_FILTERS` in `src/config/searchFilters.ts`.
- Extracted `SearchResultsShell` for search + model search pages.
- Unified trust gate via configurable `TrustGate`.
- Shared `EmptyState` under `components/ui/`; notifications empty state composes it.

### Phase 3 — Repository layer

- Formal `VehicleRepository` / `BookingRepository` interfaces.
- Booking `POST` attaches Firebase Bearer token when not in mock mode.

### Phase 4 — Feature folders

- Migrated feature slices under `src/features/` (trust, auth, browse, booking, host, messaging, map, landing, catalog) with re-export shims where needed.

### Phase 5 — Server state

- Added TanStack Query provider (`AppProviders`).
- `useVehicles` loads via Query and merges into Zustand; catalog persist limited for production builds.

### Phase 6 — Performance

- Lazy below-fold landing listings (`LandingListingsSection`).
- Large search grids use `content-visibility` containment.
- Responsive `srcSet`/`sizes` on listing card images.

### Phase 7 — Security

- `VITE_ALLOW_LOCAL_AUTH` gates credential/`btoa` login (dev default on; production example off).
- Production ID verification defaults to manual review when unset; env examples set `false`.
- Admin console requires `VITE_ADMIN_UNLOCK=true`.

### Phase 8 — Testing

- Unit coverage for search, trust predicates, booking `authenticate: true`, auth service flag.
- Playwright smoke scaffolding in `e2e/` (install `@playwright/test` to run).

### Phase 9 — Docs

- `docs/architecture.md` status table + `docs/CHANGELOG.md` kept in sync with this migration.
