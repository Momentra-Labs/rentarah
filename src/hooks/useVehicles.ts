import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'

import { vehicleQueryKeys } from '@/app/queryClient'
import { getVehicles } from '@/services/vehicleService'
import { useCarsStore } from '@/store/useCarsStore'

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
 * Catalog load via TanStack Query; mirrors results into Zustand for host-local listings + saved IDs.
 */
export function useVehicles(): UseVehiclesResult {
  const data = useCarsStore((s) => s.cars)
  const mergeApiCars = useCarsStore((s) => s.mergeApiCars)

  const query = useQuery({
    queryKey: vehicleQueryKeys.list(),
    queryFn: ({ signal }) => getVehicles(signal),
  })

  useEffect(() => {
    if (query.data) {
      mergeApiCars(query.data)
    }
  }, [query.data, mergeApiCars])

  useEffect(() => {
    if (query.isError) {
      const message = query.error instanceof Error ? query.error.message : 'Failed to load vehicles'
      useCarsStore.setState({
        vehiclesLoadStatus: 'error',
        vehiclesLoadError: message,
        hasFetchedVehicles: false,
      })
      const store = useCarsStore.getState()
      if (store.cars.length === 0) {
        store.initCars()
        useCarsStore.setState({
          vehiclesLoadStatus: 'success',
          vehiclesLoadError: null,
          hasFetchedVehicles: true,
        })
      }
    } else if (query.isFetching) {
      useCarsStore.setState({ vehiclesLoadStatus: 'loading', vehiclesLoadError: null })
    } else if (query.isSuccess) {
      useCarsStore.setState({
        vehiclesLoadStatus: 'success',
        hasFetchedVehicles: true,
        vehiclesLoadError: null,
      })
    }
  }, [query.isError, query.error, query.isFetching, query.isSuccess])

  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  const fallbackRecovered = data.length > 0
  const isError = query.isError && !fallbackRecovered
  const errorMessage =
    isError && query.error instanceof Error
      ? query.error.message
      : isError
        ? 'Failed to load vehicles'
        : null

  return {
    data,
    isLoading: query.isLoading || (query.isFetching && data.length === 0),
    isError,
    error: errorMessage,
    refetch,
  }
}
