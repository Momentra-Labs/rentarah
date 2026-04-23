/**
 * Rentara — TypeScript types & API contract reference
 * ============================================================================
 * These types describe what the **future** Node/PostgreSQL API should return.
 * DTOs may use snake_case in JSON; map to the camelCase used here in `apiClient` / service layers.
 *
 * The UI still imports `Car` for historical reasons; it is the same resource as `Vehicle` below.
 */

// --- identity & roles ---

/**
 * Renter (default) or elevated admin. Host capabilities are on {@link AuthUser} via `isHost`.
 * Future: `host` as a first-class role for payout/KYC.
 */
export type SystemRole = 'renter' | 'admin'

/**
 * Public user account — aligns with a future `users` table and JWT claims.
 * Use `id` in booking payloads and `hostId` on listings you own.
 */
export interface User {
  /** Primary key (UUID in PostgreSQL) */
  id: string
  /** Display / legal name (single string for mock auth; may split in API) */
  name: string
  /** Used for sign-in, receipts, and fraud checks */
  email: string
  /** Application-level authorization */
  role: SystemRole
}

// --- vehicle domain ---

/**
 * Coarse body / legal category. Matches URL filter `?vt=`.
 * Extensible later (e.g. `atv`, `van`) by widening this union in one place.
 */
export type VehicleType = 'car' | 'motorcycle' | 'scooter' | 'bigbike'

/**
 * @alias Vehicle
 * Primary catalog row — the API contract for `GET /vehicles` and `GET /vehicles/:id`.
 * - **Composite display name** in UI: `${year} ${make} ${model}`; no separate `name` field required.
 * - **Pricing** is daily in PHP; weekly/monthly is derived on the client or added later in API.
 */
export interface Car {
  /**
   * Unique listing id (e.g. `car_001`). API may use UUID; keep as string in the client.
   */
  id: string
  /**
   * Platform category (car vs two-wheeler segments). Drives filters and card badges.
   */
  vehicleType: VehicleType
  /**
   * OEM brand (e.g. "Toyota", "Yamaha")
   */
  make: string
  /**
   * Model line (e.g. "Fortuner", "MT-07")
   */
  model: string
  /**
   * Model year for insurance / registration display
   */
  year: number
  /**
   * Body/segment for filters — SUV, Naked, Sport, etc. Not the same as {@link vehicleType}.
   */
  type: string
  /**
   * Base rental price per calendar day in PHP (gross; fees added at checkout)
   */
  pricePerDay: number
  /**
   * Rolling average 0–5 from reviews; denormalized for sort performance
   */
  rating: number
  /**
   * Count of public reviews; shown next to stars
   */
  reviewCount: number
  /**
   * Passenger capacity; for bikes often 1–2
   */
  seats: number
  /**
   * Human-readable (e.g. "Automatic", "Manual") for chips — not an enum in MVP
   */
  transmission: string
  /**
   * Fuel for filters (Petrol, Diesel, Electric, …)
   */
  fuel: string
  /**
   * Odometer as displayed string to preserve comma formatting
   */
  odometer: string
  /**
   * Public image URLs; first entry is the card hero
   */
  images: string[]
  /**
   * Amenity / equipment list for detail page chips
   */
  features: string[]
  /**
   * Short marketing labels (e.g. "Family", "Popular")
   */
  tags: string[]
  /**
   * If false, listing is hidden and booking is blocked
   */
  available: boolean
  /**
   * Free-text pickup / city string used for search substring match
   */
  location: string
  /**
   * Optional GPS for pickup map / directions; when omitted, UI derives a stable point from {@link id}.
   */
  pickupLat?: number
  pickupLng?: number
  /**
   * Host user id — matches {@link User.id} / `users.id` in database
   */
  hostId: string
  hostName: string
  hostAvatar: string
  /** Trip count for trust badge */
  hostTrips: number
  /** SLA text for the host row */
  hostResponseTime: string
  /**
   * ISO `YYYY-MM-DD` dates the vehicle is already booked; availability checks subtract these
   */
  bookedDates: string[]
  /**
   * Long copy on detail page
   */
  description: string
  /**
   * Display plate; regulatory data may move to a `vehicles_legal` table later
   */
  plateNumber: string
  /**
   * Engine size in cc for motorcycle/scooter line items
   */
  engineCapacity?: number
  /**
   * Clutch/gear style for 2W; separate from `transmission` string when needed
   */
  transmissionType?: 'manual' | 'automatic'
  /**
   * Whether a helmet is included in the base rent
   */
  helmetIncluded?: boolean
  /**
   * When the row was created — optional until API adds it (sort by `newest` can use this)
   */
  createdAt?: string
}

/**
 * Synonym for {@link Car} in API documentation and future OpenAPI spec.
 * Import either name; they are the same type at compile time.
 */
export type Vehicle = Car

// --- search & sort ---

export interface SearchFilters {
  /** [min, max] daily price in PHP */
  priceRange: [number, number]
  /**
   * Body/segment types from the category filter (SUV, Sedan, …)
   */
  types: string[]
  /**
   * High-level class filter: `all` = no server-side `vehicleType` filter
   */
  vehicleType: 'all' | VehicleType
  transmission: string
  fuel: string
  /** 0 = any; 2/4/5/7/… */
  seats: number
  /** Hides `available: false` when true */
  availableOnly: boolean
}

// --- booking ---

/**
 * State machine for rental lifecycle. Future: add `paid`, `completed`, `disputed`
 */
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

/**
 * A confirmed or in-progress booking; maps to a `bookings` table with FKs to `users` and `vehicles`.
 * Pickup/dropoff are **ISO 8601 date strings** (date-only in MVP) for timezone-safe comparisons.
 */
export interface BookingRecord {
  /** Surrogate id from the API */
  id: string
  /**
   * References {@link Car.id} / `vehicles.id`
   */
  carId: string
  /** Renter (guest) */
  userId: string
  /**
   * Denormalized for host queries and RLS; must match vehicle’s host
   */
  hostId: string
  /**
   * Start of rental (inclusive), date or datetime per API
   */
  pickup: string
  /**
   * End of rental (inclusive for nightly calendar math — confirm with backend)
   */
  dropoff: string
  /**
   * Human reference on invoices (e.g. "RH-8K2A")
   */
  ref: string
  /**
   * Total charged in PHP (rent + platform fees as single number for list views)
   */
  total: number
  /**
   * Current workflow state; drives dashboard badges
   */
  status: BookingStatus
  /**
   * Server-side `created_at` (ISO 8601)
   */
  createdAt: string
  /** Optional denormalized fields for faster list rendering */
  carName?: string
  carImage?: string
  location?: string
  renterName?: string
}

/**
 * Alternative naming matching REST payloads (`/bookings` POST) — use when documenting greenfield API.
 * Align field names to your ORM; map to {@link BookingRecord} in the client.
 */
export interface RentalBooking {
  id: string
  userId: string
  vehicleId: string
  startDate: string
  endDate: string
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
}

// --- pricing ---

export interface PricingBreakdown {
  days: number
  subtotal: number
  serviceFee: number
  insurance: number
  total: number
}

// --- auth (existing auth store) ---

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  isHost: boolean
  avatar: string
  createdAt: string
}

export interface StoredUser extends AuthUser {
  passwordHash: string
}

// --- in-app notifications (client + future `GET /notifications`) ---

/** Drives icon, color, and filter tab grouping in the UI */
export type AppNotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_success'
  | 'payment_failed'
  | 'upcoming_rental_reminder'
  | 'system_promo'

export type AppNotification = {
  id: string
  type: AppNotificationType
  title: string
  message: string
  /** ISO 8601 — used for “2m ago” style labels */
  createdAt: string
  read: boolean
}

/** Top filter tabs on the full notifications view */
export type NotificationFilter = 'all' | 'unread' | 'bookings' | 'payments'
