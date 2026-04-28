import type { VehicleType } from '../types'

/**
 * High-quality Unsplash fallbacks by coarse vehicle category (body segment or platform class).
 * Used when a listing image fails to load or is missing.
 */
const CAR_DEFAULT =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=80'
const CAR_SUV =
  'https://images.unsplash.com/photo-1519641471658-76ce0107ad1b?w=1200&auto=format&fit=crop&q=80'
const CAR_SEDAN =
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80'
const CAR_LUXURY =
  'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&auto=format&fit=crop&q=80'
const CAR_ELECTRIC =
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&auto=format&fit=crop&q=80'
const CAR_TRUCK =
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58a1?w=1200&auto=format&fit=crop&q=80'
const CAR_BUDGET =
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&auto=format&fit=crop&q=80'

const MOTO_GENERIC =
  'https://images.unsplash.com/photo-1558980664-1db506751c3d?w=1200&auto=format&fit=crop&q=80'
const SCOOTER =
  'https://images.unsplash.com/photo-1611250506729-1dd776f09033?w=1200&auto=format&fit=crop&q=80'
const BIGBIKE_SPORT =
  'https://images.unsplash.com/photo-1578662996444-b077cf6f9248?w=1200&auto=format&fit=crop&q=80'
const ADVENTURE =
  'https://images.unsplash.com/photo-1449426468159-96d0d8716b7c?w=1200&auto=format&fit=crop&q=80'

/**
 * Resolves a category-appropriate hero image when the real thumbnail is missing or broken.
 *
 * @param vehicleType Platform class from the catalog.
 * @param bodySegment Same as {@link Car.type} — SUV, Sedan, Naked, Sport, etc.
 */
export function resolveVehicleImagePlaceholder(vehicleType: VehicleType, bodySegment?: string | null): string {
  const seg = (bodySegment ?? '').toLowerCase()

  if (vehicleType !== 'car') {
    if (vehicleType === 'scooter') return SCOOTER
    if (vehicleType === 'bigbike') {
      if (/(adventure|tour|touring|cruiser)/.test(seg)) return ADVENTURE
      if (/(sport|naked|cafe|racer)/.test(seg)) return BIGBIKE_SPORT
      return BIGBIKE_SPORT
    }
    if (/(adventure|tour|cruiser)/.test(seg)) return ADVENTURE
    return MOTO_GENERIC
  }

  if (/(suv|crossover|mpv|van)/.test(seg)) return CAR_SUV
  if (/(sedan|hatch|hatchback|compact|wagon)/.test(seg)) return CAR_SEDAN
  if (/(luxury|premium)/.test(seg)) return CAR_LUXURY
  if (/(electric|ev|hybrid)/.test(seg)) return CAR_ELECTRIC
  if (/(truck|pickup)/.test(seg)) return CAR_TRUCK
  if (/(budget|economy)/.test(seg)) return CAR_BUDGET

  return CAR_DEFAULT
}
