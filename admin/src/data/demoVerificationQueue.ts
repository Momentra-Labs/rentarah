import type { IdVerificationItem } from '../types/domain'

export const demoVerificationQueue: IdVerificationItem[] = [
  {
    id: 'idv_01',
    userId: 'user_099',
    fullName: 'Miguel Ocampo',
    email: 'miguel.ocampo@example.com',
    licenseLast4: '7821',
    submittedAt: '2026-04-28T10:05:00.000Z',
    status: 'pending_review',
  },
  {
    id: 'idv_02',
    userId: 'user_100',
    fullName: 'Sophie Lim',
    email: 'sophie.lim@example.net',
    licenseLast4: '0092',
    submittedAt: '2026-04-27T16:42:00.000Z',
    status: 'pending_review',
  },
  {
    id: 'idv_03',
    userId: 'user_101',
    fullName: 'Diego Ramos',
    email: 'diego.r@example.com',
    licenseLast4: '4410',
    submittedAt: '2026-04-26T08:55:00.000Z',
    status: 'pending_review',
    notes: 'Blurred expiry — requested re-upload in production.',
  },
]
