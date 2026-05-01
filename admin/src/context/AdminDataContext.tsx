import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { demoBookings } from '../data/demoBookings'
import { demoVerificationQueue } from '../data/demoVerificationQueue'
import { fetchCatalog } from '../lib/fetchCatalog'
import { loadListingOverrides, saveListingOverrides, type ListingAvailabilityOverrides } from '../lib/listingOverrides'
import type { Booking, IdVerificationItem, Vehicle } from '../types/domain'

type CatalogSource = 'api' | 'demo'

export interface AdminDataValue {
  vehicles: Vehicle[]
  vehiclesDisplay: Vehicle[]
  catalogSource: CatalogSource
  catalogNote: string | null
  catalogLoading: boolean
  refreshCatalog: () => Promise<void>
  setListingAvailable: (id: string, available: boolean) => void

  bookings: Booking[]
  setBookingStatus: (id: string, status: Booking['status']) => void

  verificationQueue: IdVerificationItem[]
  setVerificationStatus: (id: string, status: IdVerificationItem['status']) => void
}

const AdminDataContext = createContext<AdminDataValue | null>(null)

function mergeOverrides(vehicles: Vehicle[], overrides: ListingAvailabilityOverrides): Vehicle[] {
  return vehicles.map((v) => {
    const o = overrides[v.id]
    if (!o) return v
    return { ...v, available: o.available }
  })
}

export function AdminDataProvider({ children }: PropsWithChildren) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [catalogSource, setCatalogSource] = useState<CatalogSource>('demo')
  const [catalogNote, setCatalogNote] = useState<string | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [overrides, setOverrides] = useState<ListingAvailabilityOverrides>(() => loadListingOverrides())

  const [bookings, setBookings] = useState<Booking[]>(() => demoBookings.map((b) => ({ ...b })))

  const [verificationQueue, setVerificationQueue] = useState<IdVerificationItem[]>(() =>
    demoVerificationQueue.map((r) => ({ ...r })),
  )

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true)
    try {
      const ac = new AbortController()
      const result = await fetchCatalog(ac.signal)
      setCatalogSource(result.source)
      setCatalogNote(result.source === 'demo' ? result.fallbackReason ?? null : null)
      setVehicles(result.vehicles)
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCatalog()
  }, [refreshCatalog])

  const vehiclesDisplay = useMemo(() => mergeOverrides(vehicles, overrides), [vehicles, overrides])

  const setListingAvailable = useCallback((id: string, available: boolean) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: { available } }
      saveListingOverrides(next)
      return next
    })
  }, [])

  const setBookingStatus = useCallback((id: string, status: Booking['status']) => {
    setBookings((rows) => rows.map((b) => (b.id === id ? { ...b, status } : b)))
  }, [])

  const setVerificationStatus = useCallback((id: string, status: IdVerificationItem['status']) => {
    setVerificationQueue((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)))
  }, [])

  const value = useMemo<AdminDataValue>(
    () => ({
      vehicles,
      vehiclesDisplay,
      catalogSource,
      catalogNote,
      catalogLoading,
      refreshCatalog,
      setListingAvailable,
      bookings,
      setBookingStatus,
      verificationQueue,
      setVerificationStatus,
    }),
    [
      bookings,
      catalogLoading,
      catalogNote,
      catalogSource,
      refreshCatalog,
      setBookingStatus,
      setListingAvailable,
      setVerificationStatus,
      vehicles,
      vehiclesDisplay,
      verificationQueue,
    ],
  )

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export function useAdminData(): AdminDataValue {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider')
  return ctx
}
