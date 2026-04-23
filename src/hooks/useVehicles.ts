import { useCallback, useEffect } from 'react'

import { useCarsStore } from '../store/useCarsStore'

export interface UseVehiclesResult {
  /** Merged list from the API and any host-created rows not in the response */
  data: import('../types').Car[]
  isLoading: boolean
  isError: boolean
  error: string | null
  /** Re-runs the catalog request; pass when user retries after a failure */
  refetch: () => void
}

/**
 * Triggers the service-layer catalog load once on mount and exposes async state to the UI.
 * Safe to use in the layout and on the search page: duplicate mounts no-op via the store.
 */
export function useVehicles(): UseVehiclesResult {
  const data = useCarsStore((s) => s.cars)
  const status = useCarsStore((s) => s.vehiclesLoadStatus)
  const err = useCarsStore((s) => s.vehiclesLoadError)
  const hasFetched = useCarsStore((s) => s.hasFetchedVehicles)
  const fetchVehicles = useCarsStore((s) => s.fetchVehicles)

  useEffect(() => {
    void fetchVehicles()
  }, [fetchVehicles])

  const refetch = useCallback(() => {
    void fetchVehicles({ force: true })
  }, [fetchVehicles])

  const isLoading = status === 'loading' || (!hasFetched && status !== 'error')

  return {
    data,
    isLoading,
    /** True when the last fetch failed and the catalog is still empty (no cache / fallback). */
    isError: status === 'error' && data.length === 0,
    error: err,
    refetch,
  }
}
