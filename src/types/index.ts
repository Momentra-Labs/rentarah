/** rentaHub MVP — domain types */

export interface Car {
  id: string
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
