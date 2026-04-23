import { useCallback, useEffect, useState } from 'react'

import { getVehicleById } from '../services/vehicleService'
import type { Car } from '../types'
import { useCarsStore } from '../store/useCarsStore'

export interface UseVehicleResult {
  vehicle: Car | null
  isLoading: boolean
  isError: boolean
  error: string | null
  refetch: () => void
}

/**
 * Loads a single vehicle for detail and booking views. Tries the store first for instant render,
 * then revalidates with `GET /vehicles/:id` (or mock) so the UI stays in sync with the server.
 */
export function useVehicle(id: string | undefined): UseVehicleResult {
  const fromStore = useCarsStore((s) => (id ? s.getCarById(id) : undefined))

  const [vehicle, setVehicle] = useState<Car | null>(fromStore ?? null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setVehicle(null)
      setStatus('success')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const v = await getVehicleById(id)
      setVehicle(v)
      useCarsStore.getState().updateListing(id, v)
      setStatus('success')
    } catch (e) {
      const fromCache = useCarsStore.getState().getCarById(id)
      if (fromCache) {
        setVehicle(fromCache)
        setStatus('success')
        setError(null)
        return
      }
      setVehicle(null)
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Failed to load vehicle')
    }
  }, [id])

  useEffect(() => {
    if (id && fromStore) {
      setVehicle(fromStore)
    }
  }, [id, fromStore])

  useEffect(() => {
    void load()
  }, [load])

  return {
    vehicle: vehicle ?? fromStore ?? null,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    refetch: () => {
      void load()
    },
  }
}
