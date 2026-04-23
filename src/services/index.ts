/**
 * Barrel for service imports — use `import { getVehicles } from '@/services/vehicleService'` in practice,
 * or re-export your Nest/Express client here as the app grows.
 */
export { getJson, postJson, request, ApiError } from './apiClient'
export { API_BASE_URL, USE_MOCK_API } from './config'
export * as mockApi from './mockApi'
export { getVehicleById, getVehicles } from './vehicleService'
export { checkAvailability, createBooking } from './bookingService'
