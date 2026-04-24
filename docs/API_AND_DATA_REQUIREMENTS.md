# Rentara — API & data requirements (frontend contract)

This document describes **what the React app expects from a backend** today, **which features are still client-only** (mock / local storage), and **recommended endpoints** to reach production parity. Canonical domain types live in `src/types/index.ts`. Database modeling stays in [DATA_MODEL_AND_ARCHITECTURE.md](./DATA_MODEL_AND_ARCHITECTURE.md).

---

## Configuration

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL for JSON APIs (no trailing slash), e.g. `https://api.rentara.com`. Required when `VITE_USE_MOCK=false`. |
| `VITE_USE_MOCK` | When **not** set to the string `false`, the app uses in-memory mock data for vehicle/booking HTTP stubs (`src/services/mockApi.ts`). Set `VITE_USE_MOCK=false` to call the real network. |

The HTTP client is `src/services/apiClient.ts` (`fetch` + JSON). All domain calls should go through `vehicleService` / `bookingService` (or future modules), not raw `fetch` in components.

---

## Implemented in the client (HTTP contract)

These paths are **actually invoked** when `USE_MOCK_API` is false (`src/services/config.ts`).

### Vehicles (catalog)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/vehicles` | Full public catalog. Response: **array of `Car`** (see below). |
| `GET` | `/vehicles/:id` | Single listing. Response: **`Car`**. `404` if missing. |

### Availability (pre-checkout check)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/vehicles/:id/availability?start=YYYY-MM-DD&end=YYYY-MM-DD` | Read-only overlap check for the requested **inclusive** date range (align exact inclusive/exclusive rules with product). |

**Response shape** (`CheckAvailabilityResult` in `src/services/mockApi.ts`):

```json
{
  "available": true,
  "unavailableDates": ["2026-05-10", "2026-05-11"]
}
```

- `unavailableDates`: date-only ISO strings that **conflict** with the requested range (or full blocked set on error paths in mock).

### Bookings (service exists; checkout UI not fully wired)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/bookings` | Create booking after server-side validation. |

**Request body** (`CreateBookingPayload`):

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `vehicleId` | string | ✓ | Same as `Car.id` / listing id |
| `userId` | string | ✓ | Renter id |
| `startDate` | string | ✓ | `YYYY-MM-DD` |
| `endDate` | string | ✓ | `YYYY-MM-DD` |
| `totalPrice` | number | ✓ | PHP, major units (matches mock/fixtures) |

**Response** (today’s TypeScript expectation from `createBooking`):

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | Booking id |
| `ref` | string | Human reference (e.g. `RH-8K2A`) |
| `status` | string | e.g. `pending` \| `confirmed` \| `cancelled` |
| `createdAt` | string | ISO 8601 |

> **Note:** The booking wizard in the UI (`useBookingStore.confirmBooking`) currently **persists bookings in the browser** and updates `bookedDates` locally. To use `POST /bookings`, wire `useBooking` (`src/hooks/useBooking.ts`) into the flow and reconcile responses with `BookingRecord` in `src/types/index.ts`.

---

## `Car` (listing) JSON — fields the UI reads

The SPA treats **`Car` and `Vehicle` as the same type**. Backend may use `listing` table/column names; map to these JSON keys (camelCase) or map in `vehicleService`.

| Field | Type | Required for UI | Notes |
|-------|------|-----------------|--------|
| `id` | string | ✓ | |
| `vehicleType` | `"car"` \| `"motorcycle"` \| `"scooter"` \| `"bigbike"` | ✓ | Drives filters / badges |
| `make` | string | ✓ | |
| `model` | string | ✓ | |
| `year` | number | ✓ | |
| `type` | string | ✓ | Body/segment label (SUV, Sedan, …) — not the same as `vehicleType` |
| `pricePerDay` | number | ✓ | PHP / day |
| `rating` | number | ✓ | 0–5 display |
| `reviewCount` | number | ✓ | |
| `seats` | number | ✓ | |
| `transmission` | string | ✓ | Display string |
| `fuel` | string | ✓ | |
| `odometer` | string | ✓ | Display string (commas preserved) |
| `images` | string[] | ✓ | URLs; `[0]` is card hero |
| `features` | string[] | ✓ | |
| `tags` | string[] | ✓ | |
| `available` | boolean | ✓ | If `false`, hide / block booking |
| `location` | string | ✓ | Free text; **search** uses substring match + optional national scope (see below) |
| `pickupLat` | number | optional | Map pin; else derived from `location` heuristics (`src/data/ncrCityHalls.ts`) |
| `pickupLng` | number | optional | |
| `hostId` | string | ✓ | Must match `AuthUser.id` for host dashboards |
| `hostName` | string | ✓ | |
| `hostAvatar` | string | ✓ | Short label or initials |
| `hostTrips` | number | ✓ | Trust signal |
| `hostResponseTime` | string | ✓ | SLA text |
| `bookedDates` | string[] | ✓ | `YYYY-MM-DD` — blocked nights for calendar |
| `description` | string | ✓ | |
| `plateNumber` | string | ✓ | |
| `engineCapacity` | number | optional | cc for 2W |
| `transmissionType` | `"manual"` \| `"automatic"` | optional | |
| `helmetIncluded` | boolean | optional | |
| `createdAt` | string | optional | ISO; used for `newest` sort when present |

**Naming:** REST resources may be called `/listings` in your API; the client code path today is `/vehicles`. Either expose `/vehicles` or add a thin BFF that maps to your listing service.

---

## Search & filters (client-only today)

Search, sort, and distance are implemented in **`src/services/listingSearchService.ts`** against the in-memory catalog. For a backend equivalent, expose an endpoint that accepts the same **logical** parameters:

| Parameter | Purpose |
|-----------|---------|
| `locationQuery` | Substring match on `location` and optionally make/model; **special case**: queries normalized to `philippines` / `ph` / `pilipinas` skip location narrowing (nationwide browse). |
| `pickupDate` / `dropoffDate` | If both set, filter to vehicles **available** for the whole range (no overlap with `bookedDates` / bookings). |
| `filters` | Mirrors `SearchFilters`: `priceRange`, `types`, `vehicleType`, `transmission`, `fuel`, `seats`, `availableOnly`. |
| `sortBy` | `recommended` \| `price_asc` \| `price_desc` \| `rating` \| `newest` \| `distance_asc` |
| `modelKey` | Optional `{ make, model, vehicleType }` for compare-hosts view |

**Distance:** Client uses haversine from a reference point resolved from `locationQuery` (`resolveCityHallCoords`). API can return `distanceKm` per hit or sort server-side.

**Suggested endpoint:** `POST /listings/search` with JSON body matching the above, or `GET /listings` with extensive query params and pagination (`page`, `limit`).

---

## Auth, notifications, host listing CRUD (client-only today)

| Feature | Current behavior | API expectation |
|---------|------------------|-----------------|
| Register / login | `useAuthStore` + `AuthDialog`; persisted locally | `POST /auth/register`, `POST /auth/login`, `GET /me`, `PATCH /me`; JWT or session cookie |
| Roles / host flag | `AuthUser.isHost`, `becomeHost()` local | Persist host eligibility server-side; align with `DATA_MODEL` `users.role` |
| Notifications | `mockNotifications` + store | `GET /notifications`, `PATCH /notifications/:id/read` |
| Host creates/edits listing | `useCarsStore.addListing` / `updateListing` local | `POST /listings`, `PATCH /listings/:id` (or `/vehicles` alias) |
| Saved vehicles | `savedCarIds` in store | Optional `GET/POST/DELETE /users/me/saved-listings` |

---

## Booking & dashboard records

The UI type **`BookingRecord`** (`src/types/index.ts`) is what dashboards and cancellation flows expect when you move off local storage:

- `id`, `carId`, `userId`, `hostId`, `pickup`, `dropoff` (date strings), `ref`, `total`, `status`, `createdAt`
- Optional denormalized: `carName`, `carImage`, `location`, `renterName`

Recommended: `GET /bookings?role=renter|host`, `POST /bookings/:id/cancel`, and server enforcement of non-overlapping **confirmed** bookings per listing (see architecture doc).

---

## Related files

| Area | Path |
|------|------|
| Types | `src/types/index.ts` |
| Vehicle HTTP | `src/services/vehicleService.ts` |
| Booking HTTP | `src/services/bookingService.ts` |
| Mock payloads | `src/services/mockApi.ts` |
| Catalog load | `src/store/useCarsStore.ts` |
| Search logic | `src/services/listingSearchService.ts` |
| Fixtures | `mock-data/*.json`, `src/data/mockCars.ts` |

For PostgreSQL tables, money rules, and ER overview, see [DATA_MODEL_AND_ARCHITECTURE.md](./DATA_MODEL_AND_ARCHITECTURE.md).
