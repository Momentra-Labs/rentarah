import type { Dayjs } from 'dayjs'
import { create } from 'zustand'

import { DEFAULT_SEARCH_FILTERS } from '../config/searchFilters'
import { DEFAULT_SEARCH_LOCATION } from '../constants/geo'
import type { SearchFilters } from '../types'

export interface SearchStoreState {
  location: string
  pickup: Dayjs | null
  dropoff: Dayjs | null
  filters: SearchFilters
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'distance_asc'
  viewMode: 'grid' | 'list'
  setLocation: (location: string) => void
  setDates: (pickup: Dayjs | null, dropoff: Dayjs | null) => void
  setFilter: (partial: Partial<SearchFilters>) => void
  setSortBy: (sortBy: SearchStoreState['sortBy']) => void
  setViewMode: (viewMode: 'grid' | 'list') => void
  clearFilters: () => void
}

export const useSearchStore = create<SearchStoreState>((set) => ({
  location: DEFAULT_SEARCH_LOCATION,
  pickup: null,
  dropoff: null,
  filters: { ...DEFAULT_SEARCH_FILTERS },
  sortBy: 'recommended',
  viewMode: 'grid',
  setLocation: (location) => set({ location }),
  setDates: (pickup, dropoff) => set({ pickup, dropoff }),
  setFilter: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (viewMode) => set({ viewMode }),
  clearFilters: () => set({ filters: { ...DEFAULT_SEARCH_FILTERS } }),
}))
