import { describe, expect, it } from 'vitest'

import { routeFallbackKind } from './RouteFallback'

describe('routeFallbackKind', () => {
  it('keeps search, map, and car detail on their existing skeletons', () => {
    expect(routeFallbackKind('/search')).toBe('browse')
    expect(routeFallbackKind('/search/model')).toBe('browse')
    expect(routeFallbackKind('/cars/abc')).toBe('detail')
    expect(routeFallbackKind('/map')).toBe('map')
  })

  it('maps remaining lazy routes to page skeletons', () => {
    expect(routeFallbackKind('/dashboard')).toBe('dashboard')
    expect(routeFallbackKind('/host')).toBe('host')
    expect(routeFallbackKind('/messages')).toBe('chat')
    expect(routeFallbackKind('/messages/t1')).toBe('chat')
    expect(routeFallbackKind('/notifications')).toBe('notifications')
    expect(routeFallbackKind('/booking/car-1')).toBe('booking')
    expect(routeFallbackKind('/become-a-host')).toBe('form')
    expect(routeFallbackKind('/legal/terms')).toBe('form')
  })
})
