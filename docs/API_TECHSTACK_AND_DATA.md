# Rentara — APIs & data by technology stack

This document lists **what you need to power the whole app**, grouped by **stack / vendor** (e.g. Firebase for auth, Stripe for payments). Use it for architecture decisions and procurement.

**Related:** [API_AND_DATA_REQUIREMENTS.md](./API_AND_DATA_REQUIREMENTS.md) (REST shapes), [API_IMPLEMENTATION_BACKLOG.md](./API_IMPLEMENTATION_BACKLOG.md) (build order), [DATA_MODEL_AND_ARCHITECTURE.md](./DATA_MODEL_AND_ARCHITECTURE.md) (tables).

---

## 1. Core backend API — **Node.js + Express + Prisma + PostgreSQL**

**Role:** System of record for users (if not fully delegated to IdP), vehicles/listings, bookings, host inventory, and anything that must be consistent and auditable.

**Data (entities the UI already models in `src/types/index.ts`):**

| Domain | Main entities / fields | Notes |
|--------|------------------------|--------|
| **Users / profiles** | `AuthUser`: id, name parts, email, phone, license, `isHost`, avatar | Align with Prisma `User` + profile extensions |
| **Vehicles / listings** | `Car` / `Vehicle`: specs, `pricePerDay`, `location`, `pickupLat`/`pickupLng`, `images[]`, `bookedDates[]`, host denormalized fields | Today often merged from mock; API should return full `Car` |
| **Bookings** | `BookingRecord`: ids, `pickup`/`dropoff` (ISO datetimes in newer flows), `total`, `status`, `ref`, denormalized labels | Replace localStorage when API is live |
| **Search (server-side later)** | Same filters as `SearchFilters` + date range | Today client-side over full catalog |
| **Reviews** | Rating, text, author — on detail pages | Mock / static today |
| **Messages** | Thread linked to `bookingId` | Mock today |
| **Notifications** | In-app notification list | Mock today |

**REST endpoints (your Rentara API — implement on Express):**

| Area | Methods | Paths (as frontend expects when mocks off) |
|------|---------|---------------------------------------------|
| Health | `GET` | `/api/health` (today) — align with `VITE_API_URL` base (see backlog) |
| Catalog | `GET`, `GET` | `/vehicles`, `/vehicles/:id` |
| Availability | `GET` | `/vehicles/:id/availability?start=&end=` (date or ISO datetime — product decision) |
| Bookings | `POST` | `/bookings` |
| Bookings (future) | `GET`, `PATCH` | `/bookings`, `/bookings/:id/cancel` |
| Host CRUD (future) | `POST`, `PATCH`, `DELETE` | `/vehicles` (host-scoped) |
| Search (future) | `GET` | `/vehicles` query params or `/vehicles/search` |

**Stack:** TypeScript, Express, Prisma, PostgreSQL, `helmet`, `cors` (already in `/backend`).

---

## 2. Authentication & identity — **choose one primary approach**

The UI today uses **Zustand + `localStorage`** (`useAuthStore`) with mock users. For production you typically pick **one** of the following (you can still sync profiles to PostgreSQL).

### Option A — **Custom auth on your Node API** (matches current Prisma `User` with `password`)

| Piece | Responsibility |
|-------|----------------|
| **Your API** | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, optional `POST /auth/refresh` |
| **PostgreSQL** | User row, password hash (bcrypt/argon2), profile fields |
| **Client** | Store JWT in `memory` + refresh cookie, or httpOnly session cookie |
| **Data** | Email uniqueness, `isHost`, license fields for booking flow |

### Option B — **Firebase Authentication** (Google / email / phone)

| Piece | Responsibility |
|-------|----------------|
| **Firebase Auth** | Sign-up, sign-in, password reset, social providers, token issuance |
| **Your API** | Verify **Firebase ID token** on each request (middleware); map `firebase_uid` → internal `userId` in PostgreSQL |
| **PostgreSQL** | `users.firebase_uid`, profile row, roles — password may be empty |
| **Client** | `firebase/auth` SDK; send `Authorization: Bearer <idToken>` to Rentara API |
| **Data** | Same app-level profile fields; source of truth for credentials is Firebase |

### Option C — **Auth0 / Clerk / Cognito** (managed IdP)

| Piece | Responsibility |
|-------|----------------|
| **IdP** | Hosted login, MFA, social, orgs (if needed) |
| **Your API** | Validate JWT (JWKS); map `sub` → `userId` in PostgreSQL |
| **PostgreSQL** | Profile + `external_sub` (or provider-specific id) |
| **Client** | IdP SPA SDK + API calls with access token |

**Recommendation:** If you want the fewest moving parts and already use Prisma `User` with password, start with **Option A**; add **Firebase (B)** later if you need phone/social at scale without building it.

---

## 3. Payments — **Stripe** (already integrated in the app)

| Piece | Responsibility |
|-------|----------------|
| **Stripe.js (client)** | `VITE_STRIPE_KEY` — publishable key; `src/lib/stripe.ts`, `StripePaymentForm`, `Elements` |
| **Stripe (server)** | **Required for real charges:** create `PaymentIntent` or `Checkout Session`, webhooks (`payment_intent.succeeded`, etc.), idempotency |
| **Data** | Store `stripe_customer_id`, `payment_intent_id`, booking payment status on your DB |
| **APIs you implement** | e.g. `POST /payments/intent` (returns `clientSecret`), `POST /webhooks/stripe` (raw body + signature) |

**Not in repo yet:** backend Stripe SDK and webhook route — part of payment epic.

---

## 4. Maps, tiles & routing — **open-source stack (current UI)**

| Piece | Tech | APIs / URLs | Data |
|-------|------|-------------|------|
| **Map rendering** | **Leaflet** + **react-leaflet** | Client-only library | — |
| **Basemap tiles** | **CARTO Voyager** (OSM-derived) | `https://{s}.basemaps.cartocdn.com/...` (`RENTARA_MAP_TILE_URL`) | Raster tiles (no key required for basic use; check CARTO terms for production volume) |
| **Map data** | **OpenStreetMap** | Attribution via OSM / CARTO | Streets, places (indirect) |
| **Driving route polyline** | **OSRM** (demo) | `https://router.project-osrm.org/route/v1/driving/...` (`fetchOsrmDrivingRoute`) | GeoJSON geometry; **not for production SLA** — self-host OSRM or use Mapbox/Google Directions for reliability |
| **External “open in maps”** | **Google Maps** deep links | `https://www.google.com/maps/dir/...` | No API key for simple URLs |

**Alternatives (if you leave OSM/Carto):**

- **Mapbox** — GL/tiles + directions API (API key, usage billing).
- **Google Maps Platform** — Maps JavaScript API + Directions (keys, billing).

---

## 5. Browser geolocation — **W3C Geolocation API** (no vendor account)

| Piece | Responsibility |
|-------|----------------|
| **Client** | `navigator.geolocation` (used via `useGeolocationStore` / prompts) |
| **Your API** | Optional: accept `lat`/`lng` for “nearby” search; no third-party key |
| **Data** | User’s coarse location is ephemeral unless you persist preferences server-side |

**Privacy:** disclose in privacy policy; no backend required for “nearby” filter on device if search stays client-side.

---

## 6. Media (vehicle photos, avatars) — **object storage (not wired in UI yet)**

| Option | APIs / data |
|--------|-------------|
| **AWS S3** (+ CloudFront) | Presigned `PUT`/`POST` from API; store URLs on `Vehicle.images`, `User.avatar` |
| **Cloudinary / Uploadcare** | Upload widget + transformations; store delivery URLs in PostgreSQL |
| **Firebase Storage** | If you chose Firebase Auth, same project for host uploads |

**Today:** `Car.images` are static URLs in mock data.

---

## 7. Email & transactional messaging — **provider TBD**

| Use case | Typical stack |
|----------|----------------|
| Password reset, email verify | SendGrid, Resend, AWS SES, Postmark, or Firebase Auth built-in emails |
| Booking confirmations | Your API sends after `POST /bookings` via provider above |
| Host notifications | Same + optional push later (FCM) |

**Data:** templates, `message_id`, user email preferences (future).

---

## 8. Search & discovery (optional scale-up)

| Option | Role |
|--------|------|
| **PostgreSQL** | `ILIKE`, `tsvector`, PostGIS for radius — good for MVP |
| **Algolia / Typesense / Meilisearch** | Full-text + typo tolerance; sync from DB |
| **Elasticsearch** | Heavier; usually overkill for early stage |

**Today:** all search/filter in `listingSearchService.ts` on the client.

---

## 9. Analytics, errors, feature flags (optional)

| Piece | Examples |
|-------|----------|
| **Product analytics** | PostHog, Amplitude, Mixpanel — frontend SDK |
| **Error monitoring** | Sentry (frontend + Node) |
| **Flags** | LaunchDarkly, GrowthBook, or env-based |

Not required for MVP API; no dedicated APIs in repo.

---

## 10. Frontend configuration summary (`VITE_*`)

| Variable | Stack / purpose |
|----------|-----------------|
| `VITE_API_URL` | **Rentara Express API** base |
| `VITE_USE_MOCK` | Toggle mock vs real API |
| `VITE_STRIPE_KEY` | **Stripe** publishable |
| `VITE_BASE` | Static hosting path (e.g. GitHub Pages) |

---

## 11. Quick “who owns what” matrix

| Capability | Default / current app | You provide |
|------------|------------------------|-------------|
| Listings & bookings DB | Mock → **PostgreSQL** | **Prisma + Express** |
| Login / sessions | localStorage mock | **Your JWT/session** **or** **Firebase / Auth0 / Clerk** |
| Pay at checkout | Stripe.js test UI | **Stripe** server + webhooks |
| Map display | Leaflet + Carto/OSM | **CARTO/OSM** (tiles); comply with terms |
| Turn-by-turn line | OSRM demo | **Self-hosted OSRM** or **Mapbox/Google** for prod |
| User location | Browser geolocation | None (or store prefs in **your API**) |
| Images | Static URLs | **S3 / Cloudinary / Firebase Storage** |
| Email | None | **SES / Resend / etc.** |

---

*This is a planning document: swap vendors per row without changing the high-level domain model in `src/types/index.ts`.*
