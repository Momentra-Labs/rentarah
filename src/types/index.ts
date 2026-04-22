/** rentaHub MVP — domain types (multi-vehicle) */

/** Platform vehicle category — extensible for new kinds (e.g. boats) */
export type VehicleType = 'car' | 'motorcycle' | 'scooter' | 'bigbike'

export interface Car {
  id: string
  /** What kind of vehicle; defaults to <code>car</code> if omitted in persisted data */
  vehicleType: VehicleType
  make: string
  model: string
  year: number
  /** Body/segment (e.g. SUV, Naked) — used for car-style categories and listing UX */
  type: string
  pricePerDay: number
  rating: number
  reviewCount: number
  seats: number
  transmission: string
  fuel: string
  odometer: string
  images: string[]
  features: string[]
  tags: string[]
  available: boolean
  location: string
  hostId: string
  hostName: string
  hostAvatar: string
  hostTrips: number
  hostResponseTime: string
  bookedDates: string[]
  description: string
  plateNumber: string
  /** Two-wheeler: engine size in cc */
  engineCapacity?: number
  /** Two-wheeler: manual vs automatic (distinct from <code>transmission</code> display string) */
  transmissionType?: 'manual' | 'automatic'
  /** Two-wheeler: helmet included in rental */
  helmetIncluded?: boolean
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface BookingRecord {
  id: string
  carId: string
  userId: string
  hostId: string
  pickup: string
  dropoff: string
  ref: string
  total: number
  status: BookingStatus
  createdAt: string
  carName?: string
  carImage?: string
  location?: string
  renterName?: string
}

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

export interface SearchFilters {
  priceRange: [number, number]
  types: string[]
  /** Primary vehicle category: <code>all</code> = no filter */
  vehicleType: 'all' | VehicleType
  transmission: string
  fuel: string
  seats: number
  availableOnly: boolean
}

export interface PricingBreakdown {
  days: number
  subtotal: number
  serviceFee: number
  insurance: number
  total: number
}
