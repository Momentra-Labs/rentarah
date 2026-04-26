# Rentara — API implementation backlog

**Purpose:** One ordered backlog to take the **Express + Prisma** backend (`/backend`) from today’s health-only API to full parity with the **Vite app**, so you can turn off mocks (`VITE_USE_MOCK=false`) and point `VITE_API_URL` at the real server.

**Related docs (keep in sync):**

- [API_AND_DATA_REQUIREMENTS.md](./API_AND_DATA_REQUIREMENTS.md) — endpoint shapes, `Car` JSON, and client expectations.
- [DATA_MODEL_AND_ARCHITECTURE.md](./DATA_MODEL_AND_ARCHITECTURE.md) — domain modeling notes.
- Frontend types: `src/types/index.ts` — canonical DTOs / field names (camelCase in app; map from snake_case in API if needed).

**Backend today:** `GET /api/health`, Prisma `User` (`id`, `email`, `password`, `createdAt`), PostgreSQL. No vehicle or booking tables yet.

---

## Phase 0 — Foundation (before feature endpoints)

| Priority | Item | Notes |
|----------|------|--------|
| P0 | **Env & CORS** | `CORS_ORIGIN` for local Vite + production origin; `DATABASE_URL` documented. |
| P0 | **Error shape** | Consistent JSON errors (reuse `HttpError` / `errorHandler`); align status codes with `ApiError` in `src/services/apiClient.ts`. |
| P0 | **API prefix** | Server mounts at `/api`. Either mount feature routers at `/api/vehicles` or add a reverse-proxy rule; **frontend `apiClient` expects paths like `/vehicles`** (no `/api` prefix today). **Decision:** add `app.use('/api', …)` **and** either (a) strip `/api` in a gateway, or (b) set `VITE_API_URL` to `http://localhost:5000/api` and keep paths as `/vehicles`. Document the chosen convention in root `.env.example`. |
| P1 | **OpenAPI / contract** | Optional: generate or hand-maintain OpenAPI from `src/types` for FE/BE agreement. |
| P1 | **Pagination** | `GET /vehicles` will need `limit`, `cursor` or `page` before the catalog grows; UI today loads full list. |

---

## Phase 1 — Catalog & read models (unblocks browse, search, map)

| Priority | Item | Notes |
|----------|------|--------|
| P0 | **Prisma: `Vehicle` / listing model** | Fields aligned with `Car` in `src/types/index.ts` (including `pickupLat` / `pickupLng`, `bookedDates` or normalized `Booking` rows). |
| P0 | **`GET /vehicles`** | Returns `Car[]`. Map DB → JSON; include `bookedDates` as `YYYY-MM-DD[]` or derive from bookings. |
| P0 | **`GET /vehicles/:id`** | Single `Car`; `404` when missing / unpublished. |
| P1 | **Host denormalized fields** | `hostName`, `hostAvatar`, `hostTrips`, `hostResponseTime` — either columns on listing or join `User` / `HostProfile`. |
| P1 | **Search / filter query** | Today client filters in `listingSearchService.ts`. Backlog: `GET /vehicles/search` or query params on `GET /vehicles` (location, `vehicleType`, price range, dates for availability, sort). |
| P2 | **Images** | Start with URL strings; later S3 + upload API for hosts. |

**Frontend wiring:** `src/services/vehicleService.ts` + `useCarsStore.fetchVehicles` already call these when mocks are off.

---

## Phase 2 — Availability & pricing alignment

| Priority | Item | Notes |
|----------|------|--------|
| P0 | **`GET /vehicles/:id/availability`** | Query params: align with product (date-only vs ISO datetime). UI now uses **datetime** for trip planning; **minimum:** accept `start` / `end` as ISO strings or `YYYY-MM-DDTHH:mm` and define inclusive/exclusive rules to match `generateRentalOccupancyDates` / `calcPricing` in the app. |
| P1 | **Server-side pricing quote** | Optional `POST /bookings/quote` with `vehicleId`, `pickup`, `return` returning breakdown (subtotal, fees, insurance) so checkout matches server. |

---

## Phase 3 — Auth & users

| Priority | Item | Notes |
|----------|------|--------|
| P0 | **Extend `User` model** | Match `AuthUser` / roles: profile fields, `isHost`, license fields used in booking wizard. |
| P0 | **Register / login** | `POST /auth/register`, `POST /auth/login`; issue **httpOnly cookie** or **JWT** (frontend `useAuthStore` is local today — plan token storage + refresh). |
| P0 | **Auth middleware** | Protect host and renter routes; map to `userId` in booking payloads. |
| P1 | **Password reset / email** | Deferred until transactional email exists. |

**Prisma note:** Current schema has `password` on `User`; keep hashes only, never log plain text.

---

## Phase 4 — Bookings & mutations

| Priority | Item | Notes |
|----------|------|--------|
| P0 | **`POST /bookings`** | Body aligned with `CreateBookingPayload` in `src/services/bookingService.ts`; extend for **pickup/dropoff ISO datetimes** if product requires times on the contract. Re-validate availability transactionally; return `id`, `ref`, `status`, `createdAt`. |
| P0 | **`Booking` persistence** | Replace localStorage `useBookingStore` / `partialize` with server as source of truth; migrate `BookingRecord` shape in `src/types/index.ts`. |
| P1 | **`PATCH /bookings/:id/cancel`** | Renter/host rules; release blocked dates. |
| P1 | **`GET /bookings` (me)** | Renter trips + host incoming bookings for dashboards. |
| P2 | **Payments** | Stripe webhooks, idempotency — separate epic; UI is test-mode today. |

---

## Phase 5 — Host / listing management

| Priority | Item | Notes |
|----------|------|--------|
| P1 | **`POST /vehicles`**, **`PATCH /vehicles/:id`** | Host-only; match `ListingForm` / `useCarsStore` mutations (today local). |
| P1 | **`DELETE` or archive** | Soft-delete `available: false` vs hard delete. |
| P2 | **KYC / payout** | Future marketplace hardening. |

---

## Phase 6 — Secondary features (can parallelize after Phase 1–2)

| Priority | Item | Notes |
|----------|------|--------|
| P2 | **Reviews** | `GET /vehicles/:id/reviews`, `POST /reviews` — UI has review lists / ratings on `Car`. |
| P2 | **Messages** | Thread per booking (`/messages/:bookingId` in UI). |
| P2 | **Notifications** | Replace `mockNotifications` with `GET /notifications`, mark read. |
| P2 | **Geolocation / distance** | Optional server-side “nearby” if client-side distance is not enough. |

---

## Definition of done (MVP API)

1. `VITE_USE_MOCK=false` and `VITE_API_URL` set → **search, map, car detail, and booking happy path** work against Postgres with no mock catalog.
2. **Auth:** logged-in user can complete a booking stored on server; host sees booking in dashboard data (API or same `GET /bookings` with role filter).
3. **Availability** endpoint matches calendar + datetime rules used in car detail / checkout.
4. **CORS + HTTPS** ready for staging/production per `backend/DEPLOYMENT.md`.

---

## Suggested first sprint (concrete)

1. Resolve **`/api` vs base URL** convention and document in repo root `.env.example`.
2. Prisma migration: **Vehicle** (+ minimal Host/User relation).
3. Implement **`GET /vehicles`** and **`GET /vehicles/:id`** with seed script.
4. Wire frontend smoke test: one environment file with real API.
5. **`GET /vehicles/:id/availability`** + **`POST /bookings`** with transactional date lock.
6. **Auth** (login + JWT/cookie) + protect `POST /bookings`.

---

*Last updated: aligned with backend `User`-only schema and frontend services in `vehicleService.ts` / `bookingService.ts`. Update this file when phases complete or priorities shift.*
