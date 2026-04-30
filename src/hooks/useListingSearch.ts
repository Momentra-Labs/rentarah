import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'

import {
  runListingSearch,
  type ListingModelKey,
  type ListingSearchHit,
  type ListingSearchParams,
} from '../services/listingSearchService'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'

export interface UseListingSearchOptions {
  /** Restrict to one make/model for the multi-host comparison view. */
  modelKey?: ListingModelKey | null
  /** When false, skip network/mock search (e.g. invalid route params). */
  enabled?: boolean
}

export interface UseListingSearchResult {
  hits: ListingSearchHit[]
  vehicles: import('../types').Car[]
  /** Kept for API parity — results are synchronous from the in‑memory catalog (`vehiclesLoading` covers catalog fetch). */
  isLoading: boolean
  error: string | null
  /** Re-evaluates hits (e.g. after “Try again” when catalog was stale or a rare compute error cleared). */
  refetch: () => void
  /** True when pickup/dropoff are set and availability was applied. */
  availabilityApplied: boolean
}

function buildParams(
  modelKey: ListingModelKey | null | undefined,
  location: string,
  pickup: dayjs.Dayjs | null,
  dropoff: dayjs.Dayjs | null,
  filters: ReturnType<typeof useSearchStore.getState>['filters'],
  sortBy: ReturnType<typeof useSearchStore.getState>['sortBy'],
): ListingSearchParams {
  const pickupDate = pickup?.isValid() ? pickup.format('YYYY-MM-DD') : null
  const dropoffDate = dropoff?.isValid() ? dropoff.format('YYYY-MM-DD') : null
  return {
    locationQuery: location,
    pickupDate,
    dropoffDate,
    filters,
    sortBy,
    modelKey: modelKey ?? null,
  }
}

export function useListingSearch(options: UseListingSearchOptions = {}): UseListingSearchResult {
  const { modelKey = null, enabled = true } = options
  const cars = useCarsStore((s) => s.cars)
  const location = useSearchStore((s) => s.location)
  const pickup = useSearchStore((s) => s.pickup)
  const dropoff = useSearchStore((s) => s.dropoff)
  const filters = useSearchStore((s) => s.filters)
  const sortBy = useSearchStore((s) => s.sortBy)
  const [retryEpoch, bumpRetryEpoch] = useState(0)

  const params = useMemo(
    () => buildParams(modelKey, location, pickup, dropoff, filters, sortBy),
    [modelKey, location, pickup, dropoff, filters, sortBy],
  )

  const availabilityApplied = Boolean(
    params.pickupDate && params.dropoffDate && params.pickupDate <= params.dropoffDate,
  )

  const { hits, error } = useMemo(() => {
    if (!enabled) {
      return { hits: [] as ListingSearchHit[], error: null as string | null }
    }
    try {
      return { hits: runListingSearch(cars, params), error: null as string | null }
    } catch (e) {
      return {
        hits: [] as ListingSearchHit[],
        error: e instanceof Error ? e.message : 'Search failed',
      }
    }
  }, [cars, enabled, params, retryEpoch])

  const refetch = useCallback(() => {
    bumpRetryEpoch((n) => n + 1)
  }, [])

  const vehicles = useMemo(() => hits.map((h) => h.vehicle), [hits])

  return {
    hits,
    vehicles,
    isLoading: false,
    error,
    refetch,
    availabilityApplied,
  }
}
