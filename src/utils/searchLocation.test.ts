import { describe, expect, it } from 'vitest'

import type { Car } from '@/types'

import {
  isScopedCitySearch,
  locationsOverlap,
  sameAreaListings,
  searchAreaLabel,
  searchResultsPath,
} from './searchLocation'

const stub = (id: string, location: string): Car =>
  ({ id, location }) as Car

describe('searchAreaLabel', () => {
  it('keeps full city aliases instead of the first comma token', () => {
    expect(searchAreaLabel('BGC, Taguig')).toBe('BGC, Taguig')
    expect(searchAreaLabel('Cebu City')).toBe('Cebu City')
  })

  it('labels nationwide browse as the Philippines', () => {
    expect(searchAreaLabel('Philippines')).toBe('the Philippines')
    expect(searchAreaLabel('PH')).toBe('the Philippines')
  })
})

describe('isScopedCitySearch', () => {
  it('is true for a chosen city and false nationwide', () => {
    expect(isScopedCitySearch('Vigan')).toBe(true)
    expect(isScopedCitySearch('Philippines')).toBe(false)
    expect(isScopedCitySearch('')).toBe(false)
  })
})

describe('locationsOverlap', () => {
  it('matches neighborhood aliases to the parent city', () => {
    expect(locationsOverlap('Ortigas, Pasig', 'Pasig City')).toBe(true)
    expect(locationsOverlap('Cebu City', 'Cebu City')).toBe(true)
    expect(locationsOverlap('Cebu City', 'Davao City')).toBe(false)
  })
})

describe('sameAreaListings', () => {
  it('returns up to three overlapping cars excluding self', () => {
    const car = stub('a', 'Makati, Metro Manila')
    const all = [
      car,
      stub('b', 'Makati, Metro Manila'),
      stub('c', 'BGC, Taguig'),
      stub('d', 'Makati, Metro Manila'),
      stub('e', 'Makati, Metro Manila'),
      stub('f', 'Davao City'),
    ]
    expect(sameAreaListings(car, all).map((c) => c.id)).toEqual(['b', 'd', 'e'])
  })
})

describe('searchResultsPath', () => {
  it('includes location and omits invalid dates', () => {
    expect(searchResultsPath({ location: 'Cebu City' })).toBe('/search?location=Cebu+City')
    expect(searchResultsPath({})).toBe('/search')
  })
})
