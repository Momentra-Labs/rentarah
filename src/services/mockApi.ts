/**
 * Compatibility façade — prefer `@/repositories` for new code.
 * Runtime mock switch is solely {@link USE_MOCK_API} via `VITE_USE_MOCK`.
 */
import { USE_MOCK_API } from './config'

export { USE_MOCK_API }

/** @deprecated Use {@link USE_MOCK_API} — kept so older imports compile during migration. */
export const USE_MOCK = USE_MOCK_API

export {
  mockGetVehicles,
  mockGetVehicleById,
} from './mockApiVehicles'

export {
  mockCheckAvailability,
  mockCreateBooking,
  type CheckAvailabilityResult,
  type CreateBookingPayload,
  type CreateBookingResult,
} from './mockApiBookings'

export function isMockBuild(): boolean {
  return USE_MOCK_API
}
