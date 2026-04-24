import { useMemo } from 'react'

import { isNationalLocationQuery } from '../constants/geo'
import { useCarsStore } from '../store/useCarsStore'
import { useSearchStore } from '../store/useSearchStore'
import { matchesVehicleTypeFilter } from '../utils/vehicleUtils'

export function useFilteredCars() {
  const cars = useCarsStore((s) => s.cars)
  const location = useSearchStore((s) => s.location)
  const filters = useSearchStore((s) => s.filters)
  const sortBy = useSearchStore((s) => s.sortBy)

  const result = useMemo(() => {
    let list = [...cars]

    const qRaw = location.trim()
    const q = qRaw.toLowerCase()
    if (q && !isNationalLocationQuery(qRaw)) {
      list = list.filter(
        (c) =>
          c.location.toLowerCase().includes(q) ||
          `${c.make} ${c.model}`.toLowerCase().includes(q),
      )
    }

    const [minP, maxP] = filters.priceRange
    list = list.filter((c) => c.pricePerDay >= minP && c.pricePerDay <= maxP)

    list = list.filter((c) => matchesVehicleTypeFilter(c, filters.vehicleType))

    if (filters.types.length > 0) {
      list = list.filter((c) => filters.types.includes(c.type))
    }

    if (filters.transmission !== 'all') {
      list = list.filter((c) => c.transmission === filters.transmission)
    }

    if (filters.fuel !== 'all') {
      list = list.filter((c) => c.fuel === filters.fuel)
    }

    if (filters.seats > 0) {
      list = list.filter((c) =>
        filters.seats >= 7 ? c.seats >= 7 : c.seats === filters.seats,
      )
    }

    if (filters.availableOnly) {
      list = list.filter((c) => c.available)
    }

    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.pricePerDay - b.pricePerDay
        case 'price_desc':
          return b.pricePerDay - a.pricePerDay
        case 'rating':
          return b.rating - a.rating
        case 'newest':
          return b.year - a.year
        default:
          return b.hostTrips + b.rating * 10 - (a.hostTrips + a.rating * 10)
      }
    })

    const isFiltered =
      (q.length > 0 && !isNationalLocationQuery(qRaw)) ||
      filters.types.length > 0 ||
      filters.vehicleType !== 'all' ||
      filters.transmission !== 'all' ||
      filters.fuel !== 'all' ||
      filters.seats > 0 ||
      minP > 0 ||
      maxP < 15000 ||
      !filters.availableOnly

    return {
      cars: sorted,
      totalCount: sorted.length,
      isFiltered,
    }
  }, [cars, location, filters, sortBy])

  return result
}
