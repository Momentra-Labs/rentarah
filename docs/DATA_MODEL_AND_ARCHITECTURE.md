# Rentara — Data modeling & architecture

Production-oriented reference for PostgreSQL, REST APIs, and alignment with `mock-data/` fixtures. API payloads may use **camelCase**; database columns typically use **snake_case** with a clear mapping layer.

**SPA contract (what the React app calls today, field-by-field `Car` JSON, mock vs real HTTP):** see [API_AND_DATA_REQUIREMENTS.md](./API_AND_DATA_REQUIREMENTS.md).

---

## Design principles

- **PostgreSQL** as the system of record.
- **Identifiers**: UUIDs (or prefixed text IDs in fixtures, e.g. `user_001`); production should prefer `uuid` with optional human-readable slugs.
- **Normalization**: core entities normalized; **denormalized** aggregates on listings (`rating_avg`, `review_count`) updated by triggers, jobs, or application events.
- **Money**: choose one rule — **`integer` minor units** (centavos) *or* **`numeric(12,2)`** in major currency units. Fixtures use whole PHP amounts as integers; document the contract in API/OpenAPI.
- **Time**: trip bounds as **`date`**; event times as **`timestamptz`**.

---

## Core entities

### users

| Column | Type | Required | Notes |
|--------|------|----------|--------|
| `id` | `uuid` PK | ✓ | |
| `email` | `citext` UNIQUE | ✓ | |
| `password_hash` | `text` | ✓* | *Omit or null for OAuth-only accounts |
| `first_name` | `varchar(100)` | ✓ | |
| `last_name` | `varchar(100)` | ✓ | |
| `phone` | `varchar(32)` | optional | Normalize to E.164 |
| `role` | `varchar(16)` | ✓ | MVP: `host` \| `renter` \| `admin` (split `user_roles` later if needed) |
| `avatar_url` | `text` | optional | |
| `license_number` | `varchar(64)` | optional | KYC / compliance |
| `email_verified_at` | `timestamptz` | optional | |
| `created_at` | `timestamptz` | ✓ | |
| `updated_at` | `timestamptz` | ✓ | |

**Indexes:** `UNIQUE(email)`; `(role)`; optional partial index on verified users if heavily filtered.

---

### listings

| Column | Type | Required | Notes |
|--------|------|----------|--------|
| `id` | `uuid` PK | ✓ | |
| `host_user_id` | `uuid` FK → `users(id)` | ✓ | ON DELETE RESTRICT |
| `status` | `varchar(16)` | ✓ | `draft` \| `active` \| `inactive` \| `suspended` |
| `vehicle_type` | `varchar(32)` | ✓ | e.g. car, motorcycle |
| `make` | `varchar(128)` | ✓ | |
| `model` | `varchar(128)` | ✓ | |
| `year` | `smallint` | ✓ | |
| `type` | `varchar(64)` | optional | body / segment label |
| `description` | `text` | ✓ | |
| `price_per_day` | `numeric(12,2)` | ✓ | |
| `currency` | `char(3)` | ✓ | e.g. `PHP` |
| `seats` | `smallint` | ✓ | |
| `transmission` | `varchar(32)` | optional | |
| `fuel` | `varchar(32)` | optional | |
| `plate_number` | `varchar(32)` | optional | |
| `location` | `text` | ✓ | display + search |
| `pickup_lat` | `double precision` | optional | PostGIS `geography` later |
| `pickup_lng` | `double precision` | optional | |
| `images` | `jsonb` | ✓ | array of URLs |
| `features` | `jsonb` | ✓ | array |
| `tags` | `jsonb` | ✓ | array |
| `rating_avg` | `numeric(2,1)` | ✓ | default `0`; denormalized |
| `review_count` | `integer` | ✓ | default `0` |
| `engine_capacity` | `integer` | optional | e.g. motorcycles |
| `helmet_included` | `boolean` | optional | |
| `created_at` | `timestamptz` | ✓ | |
| `updated_at` | `timestamptz` | ✓ | |

**Indexes:** `(host_user_id)`; `(status)`; `(vehicle_type)`; partial `(status) WHERE status = 'active'`; `(price_per_day)`; GIN on `tags` if filtered; GiST on geography when adopted.

---

### bookings

| Column | Type | Required | Notes |
|--------|------|----------|--------|
| `id` | `uuid` PK | ✓ | |
| `listing_id` | `uuid` FK → `listings(id)` | ✓ | |
| `renter_user_id` | `uuid` FK → `users(id)` | ✓ | |
| `host_user_id` | `uuid` FK → `users(id)` | ✓ | Denormalized from listing for host dashboards |
| `status` | `varchar(24)` | ✓ | See lifecycle below |
| `pickup_date` | `date` | ✓ | |
| `dropoff_date` | `date` | ✓ | Define inclusive/exclusive rule in app |
| `currency` | `char(3)` | ✓ | |
| `subtotal` | `numeric(12,2)` | ✓ | snapshot at checkout |
| `service_fee` | `numeric(12,2)` | ✓ | |
| `insurance` | `numeric(12,2)` | ✓ | |
| `total_amount` | `numeric(12,2)` | ✓ | |
| `created_at` | `timestamptz` | ✓ | |
| `confirmed_at` | `timestamptz` | optional | after successful payment |
| `cancelled_at` | `timestamptz` | optional | |
| `completed_at` | `timestamptz` | optional | after trip / host confirmation |

**Suggested lifecycle:** `pending_payment` → `confirmed` → `completed`; branches to `cancelled` from `pending_payment` or `confirmed` per business rules.

**Indexes:** `(renter_user_id, created_at DESC)`; `(host_user_id, created_at DESC)`; `(listing_id, pickup_date, dropoff_date)`.

**Concurrency:** use an **exclusion constraint** or equivalent so **confirmed** bookings cannot overlap on the same listing (e.g. `btree_gist` + `daterange` on `(listing_id, daterange(pickup_date, dropoff_date, '[]'))` WHERE `status` in active states).

---

### payments

| Column | Type | Required | Notes |
|--------|------|----------|--------|
| `id` | `uuid` PK | ✓ | |
| `booking_id` | `uuid` FK → `bookings(id)` | optional | null = failed intent before a booking exists |
| `payer_user_id` | `uuid` FK → `users(id)` | ✓ | usually renter |
| `amount` | `numeric(12,2)` | ✓ | |
| `currency` | `char(3)` | ✓ | |
| `status` | `varchar(16)` | ✓ | `pending` \| `succeeded` \| `failed` \| `refunded` |
| `provider` | `varchar(24)` | ✓ | e.g. `stripe` |
| `provider_payment_intent_id` | `varchar(255)` | optional | UNIQUE when not null |
| `provider_charge_id` | `varchar(255)` | optional | |
| `failure_code` | `text` | optional | |
| `failure_message` | `text` | optional | |
| `created_at` | `timestamptz` | ✓ | |
| `updated_at` | `timestamptz` | ✓ | |

**Indexes:** `UNIQUE(provider_payment_intent_id)` WHERE NOT NULL; `(booking_id)`; `(payer_user_id, created_at DESC)`; `(status)`.

---

### reviews

| Column | Type | Required | Notes |
|--------|------|----------|--------|
| `id` | `uuid` PK | ✓ | |
| `booking_id` | `uuid` FK → `bookings(id)` | ✓ | |
| `listing_id` | `uuid` FK → `listings(id)` | ✓ | denormalized for listing pages |
| `reviewer_user_id` | `uuid` FK → `users(id)` | ✓ | |
| `reviewee_user_id` | `uuid` FK → `users(id)` | ✓ | host or renter |
| `rating` | `smallint` | ✓ | 1–5 |
| `comment` | `text` | optional | |
| `visibility` | `varchar(16)` | ✓ | `public` \| `hidden` |
| `created_at` | `timestamptz` | ✓ | |

**Uniqueness:** `UNIQUE(booking_id, reviewer_user_id)` so both sides of a trip can review once each.

**Indexes:** `(listing_id, created_at DESC)`; `(reviewee_user_id)`.

---

## Relationships (ER-style)

| Relationship | Cardinality | Notes |
|--------------|-------------|--------|
| users → listings | 1 : N | Host owns many listings |
| listings → bookings | 1 : N | Non-overlapping confirmed windows per listing |
| users → bookings (as renter) | 1 : N | |
| users → bookings (as host) | 1 : N | Via `host_user_id` |
| bookings → payments | 1 : 0..N | Multiple attempts; typically one succeeded charge per booking in MVP |
| bookings → reviews | 1 : 0..N | Often 1–2 rows per booking (guest ↔ host) |

### Ownership & permissions (conceptual)

- **Host:** CRUD own listings; read bookings where `host_user_id = current_user`; transition booking when policy allows.
- **Renter:** create booking intent; pay; read own bookings; create reviews when booking is `completed`.
- **Admin:** moderation, refunds, suspend listings.

---

## Scalability (100k+ users and beyond)

- **Connection pooling** (e.g. PgBouncer) and **read replicas** for search and listing feeds.
- **Partition** high-volume tables (`bookings`, `payments`) by time when row counts warrant it.
- **Cache** hot listing cards (Redis) with short TTL; invalidate on listing updates.
- **Async workers** for email, webhooks, and aggregate updates.
- **Idempotency-Key** header on `POST /bookings` and payment confirmation endpoints.

---

## REST API (resource-oriented)

Group routes by resource. Auth may live in a separate module or service.

**Client implementation note:** the Vite app currently calls **`GET /vehicles`**, **`GET /vehicles/:id`**, **`GET /vehicles/:id/availability`**, and **`POST /bookings`** when `VITE_USE_MOCK=false` (`src/services/vehicleService.ts`, `bookingService.ts`). You may implement those paths literally or provide a gateway that maps them to **`/listings`** resources below.

### Auth / users

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `PATCH /me`

### Listings (vehicles catalog)

- `GET /listings` — query: `status`, `vehicleType`, `location`, `priceMin`, `priceMax`, `page`, `limit` (alias: **`GET /vehicles`** for the SPA today)
- `GET /listings/:id` (alias: **`GET /vehicles/:id`**)
- `POST /listings` (host)
- `PATCH /listings/:id` (host)
- `GET /listings/:id/availability?start=&end=` (alias: **`GET /vehicles/:id/availability`**)

**Search:** the UI performs full filtering in-memory today. For scale, add **`POST /listings/search`** (or rich `GET /listings` query) — parameters described in [API_AND_DATA_REQUIREMENTS.md](./API_AND_DATA_REQUIREMENTS.md#search--filters-client-only-today).

### Bookings

- `POST /listings/:listingId/bookings` or **`POST /bookings`** with `listingId` / `vehicleId` — returns `pending_payment` and payment client secret when applicable (see [API_AND_DATA_REQUIREMENTS.md](./API_AND_DATA_REQUIREMENTS.md) for the current JSON body shape used in the client service layer)
- `GET /bookings` — query: `role=renter|host`
- `GET /bookings/:id`
- `POST /bookings/:id/cancel`
- `POST /bookings/:id/complete` (host or system job)

### Payments

- `POST /payments/intent` — optional if created with booking
- `POST /webhooks/:provider` — server-only (signature verification)

### Reviews

- `POST /reviews` — body: `bookingId`, `rating`, `comment` (server enforces `completed` + eligibility)
- `GET /listings/:id/reviews`

### Example: create booking (response shape)

```json
{
  "id": "uuid",
  "status": "pending_payment",
  "listingId": "uuid",
  "renterUserId": "uuid",
  "hostUserId": "uuid",
  "pickupDate": "2026-05-01",
  "dropoffDate": "2026-05-05",
  "totalAmount": 12500,
  "currency": "PHP",
  "payment": {
    "status": "pending",
    "clientSecret": "optional"
  }
}
```

---

## Fixture alignment (`mock-data/`)

The JSON files under `mock-data/` mirror this model with camelCase field names:

- `listings.hostUserId` → `users.id`
- `bookings.listingId`, `renterUserId`, `hostUserId` → listings and users
- `payments.bookingId` (optional), `payerUserId` → bookings and users
- `reviews.bookingId`, `listingId`, `reviewerUserId`, `revieweeUserId` → bookings, listings, users

Use this document as the source of truth when generating migrations, OpenAPI specs, or validation scripts.
