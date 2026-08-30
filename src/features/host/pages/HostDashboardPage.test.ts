import { describe, expect, it } from 'vitest'

import type { BookingRecord } from '@/types'

import {
  bookingStatusLabel,
  getHostNextStep,
  hostSectionToTab,
  sortHostBookingsByPriority,
} from './HostDashboardPage'

function booking(id: string, status: BookingRecord['status']): BookingRecord {
  return {
    id,
    carId: 'car-1',
    userId: 'renter-1',
    hostId: 'host-1',
    pickup: '2026-09-01',
    dropoff: '2026-09-03',
    ref: `RH-${id}`,
    total: 1000,
    status,
    createdAt: '2026-08-01T00:00:00.000Z',
  }
}

describe('hostSectionToTab', () => {
  it('maps listings aliases and empty section to Listings', () => {
    expect(hostSectionToTab(null)).toBe(0)
    expect(hostSectionToTab('')).toBe(0)
    expect(hostSectionToTab('list')).toBe(0)
    expect(hostSectionToTab('listings')).toBe(0)
  })

  it('maps bookings aliases to Requests', () => {
    expect(hostSectionToTab('bookings')).toBe(1)
    expect(hostSectionToTab('requests')).toBe(1)
  })

  it('maps earnings and settings', () => {
    expect(hostSectionToTab('earnings')).toBe(2)
    expect(hostSectionToTab('settings')).toBe(3)
  })

  it('falls back unknown sections to Listings', () => {
    expect(hostSectionToTab('unknown')).toBe(0)
  })
})

describe('bookingStatusLabel', () => {
  it('uses title-case labels instead of raw enums', () => {
    expect(bookingStatusLabel('pending')).toBe('Pending')
    expect(bookingStatusLabel('confirmed')).toBe('Confirmed')
    expect(bookingStatusLabel('cancelled')).toBe('Cancelled')
  })
})

describe('sortHostBookingsByPriority', () => {
  it('sorts pending first, then confirmed, then cancelled', () => {
    const sorted = sortHostBookingsByPriority([
      booking('c', 'cancelled'),
      booking('n', 'confirmed'),
      booking('p2', 'pending'),
      booking('p1', 'pending'),
    ])
    expect(sorted.map((b) => b.status)).toEqual(['pending', 'pending', 'confirmed', 'cancelled'])
    expect(sorted.map((b) => b.id)).toEqual(['p2', 'p1', 'n', 'c'])
  })
})

describe('getHostNextStep', () => {
  it('prioritizes pending requests over missing listings', () => {
    const step = getHostNextStep(2, 0, 0)
    expect(step?.target).toBe('bookings')
    expect(step?.text).toBe('2 booking requests need a reply')
  })

  it('prompts to add a listing when the host has none', () => {
    const step = getHostNextStep(0, 0, 0)
    expect(step?.target).toBe('add-listing')
    expect(step?.text).toBe('Add a vehicle to start getting bookings')
  })

  it('prompts when every listing is hidden from search', () => {
    const step = getHostNextStep(0, 3, 3)
    expect(step?.target).toBe('listings')
    expect(step?.text).toBe('3 listings are hidden from search')
  })

  it('hides the strip when there is nothing to do', () => {
    expect(getHostNextStep(0, 2, 1)).toBeNull()
  })
})
