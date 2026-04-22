import type { Dayjs } from 'dayjs'
import { create } from 'zustand'

import type { SearchFilters } from '../types'

const defaultFilters: SearchFilters = {
  priceRange: [0, 15000],
  types: [],
  transmission: 'all',
  fuel: 'all',
  seats: 0,
  availableOnly: true,
}

export interface SearchStoreState {
  location: string
  pickup: Dayjs | null
  dropoff: Dayjs | null
  filters: SearchFilters
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
  viewMode: 'grid' | 'list'
  setLocation: (location: string) => void
  setDates: (pickup: Dayjs | null, dropoff: Dayjs | null) => void
  setFilter: (partial: Partial<SearchFilters>) => void
  setSortBy: (sortBy: SearchStoreState['sortBy']) => void
  setViewMode: (viewMode: 'grid' | 'list') => void
  clearFilters: () => void
}

export const useSearchStore = create<SearchStoreState>((set) => ({
  location: 'Metro Manila',
  pickup: null,
  dropoff: null,
  filters: { ...defaultFilters },
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
  clearFilters: () => set({ filters: { ...defaultFilters } }),
}))
