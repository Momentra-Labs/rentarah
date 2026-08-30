import { describe, expect, it } from 'vitest'

import type { BookingRecord } from '../types'

import {
  bookingStatusLabel,
  getRenterNextStep,
  pastBookingLabel,
  renterIdentityGate,
  renterNavToTab,
  sortRenterBookingsByPriority,
} from './DashboardPage'

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

describe('renterNavToTab', () => {
  it('maps trips and empty nav to Trips', () => {
    expect(renterNavToTab(null)).toBe(0)
    expect(renterNavToTab('')).toBe(0)
    expect(renterNavToTab('trips')).toBe(0)
  })

  it('maps remaining account sections', () => {
    expect(renterNavToTab('past')).toBe(1)
    expect(renterNavToTab('saved')).toBe(2)
    expect(renterNavToTab('reviews')).toBe(3)
    expect(renterNavToTab('profile')).toBe(4)
  })

  it('falls back unknown nav to Trips', () => {
    expect(renterNavToTab('unknown')).toBe(0)
  })
})

describe('booking and past labels', () => {
  it('uses title-case trip labels', () => {
    expect(bookingStatusLabel('pending')).toBe('Pending')
    expect(bookingStatusLabel('confirmed')).toBe('Confirmed')
    expect(bookingStatusLabel('cancelled')).toBe('Cancelled')
  })

  it('labels past trips as Completed or Cancelled', () => {
    expect(pastBookingLabel('confirmed')).toBe('Completed')
    expect(pastBookingLabel('pending')).toBe('Completed')
    expect(pastBookingLabel('cancelled')).toBe('Cancelled')
  })
})

describe('sortRenterBookingsByPriority', () => {
  it('sorts pending first, then confirmed, then cancelled', () => {
    const sorted = sortRenterBookingsByPriority([
      booking('c', 'cancelled'),
      booking('n', 'confirmed'),
      booking('p', 'pending'),
    ])
    expect(sorted.map((b) => b.status)).toEqual(['pending', 'confirmed', 'cancelled'])
  })
})

describe('renterIdentityGate', () => {
  it('treats none and rejected as unverified', () => {
    expect(renterIdentityGate(undefined)).toBe('unverified')
    expect(renterIdentityGate('none')).toBe('unverified')
    expect(renterIdentityGate('rejected')).toBe('unverified')
    expect(renterIdentityGate('pending_review')).toBe('pending_review')
    expect(renterIdentityGate('approved')).toBe('approved')
  })
})

describe('getRenterNextStep', () => {
  it('prioritizes pending bookings over identity and browse prompts', () => {
    const step = getRenterNextStep(1, 0, 'unverified')
    expect(step?.target).toBe('trips')
    expect(step?.text).toBe('1 booking is waiting for the host')
  })

  it('prompts identity verification when there are no pending bookings', () => {
    const step = getRenterNextStep(0, 2, 'unverified')
    expect(step?.target).toBe('verify')
  })

  it('prompts browse when identity is fine and there are no upcoming trips', () => {
    const step = getRenterNextStep(0, 0, 'approved')
    expect(step?.target).toBe('search')
    expect(step?.text).toBe('Find a vehicle for your next trip')
  })

  it('hides the strip when trips exist and identity is not blocking', () => {
    expect(getRenterNextStep(0, 1, 'approved')).toBeNull()
    expect(getRenterNextStep(0, 1, 'pending_review')).toBeNull()
  })
})
