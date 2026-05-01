/** Mirrors marketplace `Car` / `Vehicle` — keep in sync when API ships. */
export type VehicleType = 'car' | 'motorcycle' | 'scooter' | 'bigbike'

export interface Vehicle {
  id: string
  vehicleType: VehicleType
  make: string
  model: string
  year: number
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
  engineCapacity?: number
  helmetIncluded?: boolean
  transmissionType?: 'manual' | 'automatic'
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Booking {
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
  renterName?: string
  location?: string
}

export type IdReviewStatus = 'pending_review' | 'approved' | 'rejected'

export interface IdVerificationItem {
  id: string
  userId: string
  fullName: string
  email: string
  licenseLast4: string
  submittedAt: string
  status: IdReviewStatus
  notes?: string
}
