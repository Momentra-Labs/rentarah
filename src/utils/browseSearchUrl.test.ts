import { describe, expect, it, vi } from 'vitest'

import { applyBrowseUrlToStore, buildBrowseSearchParams } from './browseSearchUrl'

function mockStore(location: string) {
  const store = {
    location,
    pickup: null as null,
    dropoff: null as null,
    filters: { types: [] as string[], vehicleType: 'all' as const },
    setLocation: (next: string) => {
      store.location = next
    },
    setDates: vi.fn(),
    setFilter: vi.fn(),
  }
  return store
}

describe('browseSearchUrl', () => {
  it('keeps nationwide Philippines instead of replacing it with the default city', () => {
    const store = mockStore('Metro Manila')
    applyBrowseUrlToStore('?location=Philippines', store)
    expect(store.location).toBe('Philippines')
    expect(buildBrowseSearchParams(store).get('location')).toBe('Philippines')
  })

  it('does not invent Metro Manila when serializing a Philippines search', () => {
    const params = buildBrowseSearchParams({
      location: 'Philippines',
      pickup: null,
      dropoff: null,
      filters: { types: [], vehicleType: 'all' },
    })
    expect(params.get('location')).toBe('Philippines')
    expect(params.toString()).toBe('location=Philippines')
  })
})
