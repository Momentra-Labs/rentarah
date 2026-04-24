import dayjs from 'dayjs'

import type { AppNotification } from '../types'

/** Demo notifications — times relative to now on first app load (persisted read state in store). */
export function createInitialNotifications(): AppNotification[] {
  return [
    {
      id: 'n_01',
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      message: 'Your Honda PCX rental is confirmed for Apr 25–28. Pickup details are in My Trips.',
      createdAt: dayjs().subtract(2, 'minute').toISOString(),
      read: false,
    },
    {
      id: 'n_02',
      type: 'upcoming_rental_reminder',
      title: 'Rental starts tomorrow',
      message: 'Reminder: pick up your Yamaha MT-07 at 9:00 AM. Bring a valid license.',
      createdAt: dayjs().subtract(1, 'hour').toISOString(),
      read: false,
    },
    {
      id: 'n_03',
      type: 'payment_success',
      title: 'Payment successful',
      message: 'We received PHP 4,250 for booking RH-8K2A. A receipt was sent to your email.',
      createdAt: dayjs().subtract(3, 'hour').toISOString(),
      read: true,
    },
    {
      id: 'n_04',
      type: 'system_promo',
      title: 'Scooter weekend',
      message: '20% off scooter rentals this weekend nationwide — browse scooters on Rentara.',
      createdAt: dayjs().subtract(1, 'day').toISOString(),
      read: true,
    },
    {
      id: 'n_05',
      type: 'booking_cancelled',
      title: 'Booking cancelled',
      message: 'Your request for the Toyota Fortuner (Apr 12–14) was cancelled by the host.',
      createdAt: dayjs().subtract(2, 'day').toISOString(),
      read: true,
    },
    {
      id: 'n_06',
      type: 'payment_failed',
      title: 'Payment could not be processed',
      message: 'Your card was declined. Update your payment method to keep your booking on hold.',
      createdAt: dayjs().subtract(2, 'day').add(1, 'hour').toISOString(),
      read: false,
    },
  ]
}
