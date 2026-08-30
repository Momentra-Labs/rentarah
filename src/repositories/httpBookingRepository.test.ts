import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/apiClient', () => ({
  postJson: vi.fn(),
  getJson: vi.fn(),
}))

import { postJson } from '@/services/apiClient'

import { httpBookingRepository } from './httpBookingRepository'

describe('httpBookingRepository', () => {
  beforeEach(() => {
    vi.mocked(postJson).mockReset()
  })

  it('creates bookings with authenticate: true', async () => {
    vi.mocked(postJson).mockResolvedValue({
      id: 'bkg_1',
      ref: 'RH-TEST',
      status: 'pending',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const payload = {
      vehicleId: 'car_001',
      userId: 'user_001',
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      totalPrice: 5000,
    }

    await httpBookingRepository.createBooking(payload)

    expect(postJson).toHaveBeenCalledWith('/bookings', payload, undefined, { authenticate: true })
  })
})
