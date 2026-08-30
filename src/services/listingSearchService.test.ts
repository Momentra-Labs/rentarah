import { describe, expect, it } from 'vitest'

import { DEFAULT_SEARCH_FILTERS } from '@/config/searchFilters'
import type { Car } from '@/types'

import { runListingSearch } from './listingSearchService'

function stubCar(overrides: Partial<Car> = {}): Car {
  return {
    id: 'car_1',
    hostId: 'user_001',
    hostName: 'Host',
    hostAvatar: 'H',
    hostTrips: 10,
    hostResponseTime: '1 hour',
    make: 'Toyota',
    model: 'Vios',
    year: 2022,
    type: 'Sedan',
    vehicleType: 'car',
    description: 'Test',
    pricePerDay: 2000,
    seats: 5,
    transmission: 'Automatic',
    fuel: 'Gasoline',
    odometer: '10,000 km',
    plateNumber: 'ABC 1234',
    location: 'Makati, Metro Manila',
    pickupLat: 14.55,
    pickupLng: 121.02,
    images: [],
    features: [],
    tags: [],
    rating: 4.5,
    reviewCount: 3,
    available: true,
    bookedDates: [],
    ...overrides,
  }
}

describe('runListingSearch', () => {
  it('filters by price range and availableOnly', () => {
    const cars = [
      stubCar({ id: 'a', pricePerDay: 1000, available: true }),
      stubCar({ id: 'b', pricePerDay: 9000, available: true }),
      stubCar({ id: 'c', pricePerDay: 1500, available: false }),
    ]
    const hits = runListingSearch(cars, {
      locationQuery: 'Philippines',
      pickupDate: null,
      dropoffDate: null,
      filters: { ...DEFAULT_SEARCH_FILTERS, priceRange: [0, 3000] },
      sortBy: 'price_asc',
    })
    expect(hits.map((h) => h.vehicle.id)).toEqual(['a'])
  })

  it('restricts to modelKey when provided', () => {
    const cars = [
      stubCar({ id: 'a', make: 'Toyota', model: 'Vios', vehicleType: 'car' }),
      stubCar({ id: 'b', make: 'Honda', model: 'City', vehicleType: 'car' }),
    ]
    const hits = runListingSearch(cars, {
      locationQuery: 'Philippines',
      pickupDate: null,
      dropoffDate: null,
      filters: { ...DEFAULT_SEARCH_FILTERS },
      sortBy: 'recommended',
      modelKey: { make: 'Toyota', model: 'Vios', vehicleType: 'car' },
    })
    expect(hits).toHaveLength(1)
    expect(hits[0]?.vehicle.id).toBe('a')
  })
})
