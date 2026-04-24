import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  fetchListingSearch,
  type ListingModelKey,
  type ListingSearchHit,
  type ListingSearchParams,
} from '../services/listingSearchService'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'

const DEBOUNCE_MS = 320

export interface UseListingSearchOptions {
  /** Restrict to one make/model for the multi-host comparison view. */
  modelKey?: ListingModelKey | null
  /** When false, skip network/mock search (e.g. invalid route params). */
  enabled?: boolean
}

export interface UseListingSearchResult {
  hits: ListingSearchHit[]
  vehicles: import('../types').Car[]
  isLoading: boolean
  error: string | null
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

/** Stable key so `filters` / `modelKey` object identity does not retrigger search every render. */
function paramsDependencyKey(
  modelKey: ListingModelKey | null | undefined,
  location: string,
  pickup: dayjs.Dayjs | null,
  dropoff: dayjs.Dayjs | null,
  filters: ReturnType<typeof useSearchStore.getState>['filters'],
  sortBy: ReturnType<typeof useSearchStore.getState>['sortBy'],
): string {
  const pk = modelKey ? `${modelKey.make}\0${modelKey.model}\0${modelKey.vehicleType}` : ''
  const pu = pickup?.isValid() ? pickup.format('YYYY-MM-DD') : ''
  const dr = dropoff?.isValid() ? dropoff.format('YYYY-MM-DD') : ''
  const fr = JSON.stringify(filters)
  return [pk, location, pu, dr, fr, sortBy].join('\n')
}

export function useListingSearch(options: UseListingSearchOptions = {}): UseListingSearchResult {
  const { modelKey = null, enabled = true } = options
  const cars = useCarsStore((s) => s.cars)
  const location = useSearchStore((s) => s.location)
  const pickup = useSearchStore((s) => s.pickup)
  const dropoff = useSearchStore((s) => s.dropoff)
  const filters = useSearchStore((s) => s.filters)
  const sortBy = useSearchStore((s) => s.sortBy)

  const [hits, setHits] = useState<ListingSearchHit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceBoot = useRef(false)

  const params = useMemo(
    () => buildParams(modelKey, location, pickup, dropoff, filters, sortBy),
    [modelKey, location, pickup, dropoff, filters, sortBy],
  )

  const paramsKey = useMemo(
    () => paramsDependencyKey(modelKey, location, pickup, dropoff, filters, sortBy),
    [modelKey, location, pickup, dropoff, filters, sortBy],
  )

  const availabilityApplied = Boolean(
    params.pickupDate && params.dropoffDate && params.pickupDate <= params.dropoffDate,
  )

  const refetch = useCallback(async () => {
    if (!enabled) {
      setHits([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchListingSearch(cars, params)
      setHits(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [cars, params, enabled])

  useEffect(() => {
    if (!enabled) {
      setHits([])
      setIsLoading(false)
      setError(null)
      return
    }

    let active = true
    const delayMs = debounceBoot.current ? DEBOUNCE_MS : 0
    debounceBoot.current = true

    const schedule = window.setTimeout(async () => {
      if (!active) return
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchListingSearch(cars, params)
        if (!active) return
        setHits(result)
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Search failed')
      } finally {
        if (active) setIsLoading(false)
      }
    }, delayMs)

    return () => {
      active = false
      window.clearTimeout(schedule)
      setIsLoading(false)
    }
  }, [cars, enabled, paramsKey, params])

  const vehicles = useMemo(() => hits.map((h) => h.vehicle), [hits])

  return {
    hits,
    vehicles,
    isLoading,
    error,
    refetch,
    availabilityApplied,
  }
}
