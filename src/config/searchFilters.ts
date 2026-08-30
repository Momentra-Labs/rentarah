import type { SearchFilters } from '@/types'

/** Single source of truth for browse/search default filters. */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  priceRange: [0, 15000],
  types: [],
  vehicleType: 'all',
  transmission: 'all',
  fuel: 'all',
  seats: 0,
  availableOnly: true,
}

export const SEARCH_PAGE_SIZE = 6
