import { Container } from '@mui/material'
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import BrowseCarSearch from '@/components/browse/BrowseCarSearch'
import SearchResultsShell from '@/components/browse/SearchResultsShell'
import { useListingSearch } from '@/hooks/useListingSearch'
import { useT } from '@/hooks/useT'
import { useVehicles } from '@/hooks/useVehicles'
import { prefetchPath } from '@/lib/routePrefetch'
import { useSearchStore } from '@/store/useSearchStore'
import { containerGutters } from '@/theme/pageStyles'
import type { Car } from '@/types'
import {
  formatSearchDateTimeParam,
  parseSearchDateTimeParam,
  withDefaultDropoffTime,
} from '@/utils/dateUtils'
import { areUrlSearchQueriesEqual } from '@/utils/urlQueryCompare'
import { isValidVehicleType } from '@/utils/vehicleUtils'

export default function SearchPage() {
  const t = useT()
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const { isLoading: vehiclesLoading, isError: vehiclesFatalError, error: vehiclesError, refetch: refetchVehicles } =
    useVehicles()
  const {
    hits,
    isLoading: searchLoading,
    error: searchError,
    refetch: refetchSearch,
    availabilityApplied,
  } = useListingSearch()
  const [, setSearchParams] = useSearchParams()

  const location = useSearchStore((s) => s.location)
  const pickup = useSearchStore((s) => s.pickup)
  const dropoff = useSearchStore((s) => s.dropoff)
  const filters = useSearchStore((s) => s.filters)
  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)
  const setFilter = useSearchStore((s) => s.setFilter)

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const filtersTypesKey = useMemo(() => [...filters.types].sort().join('|'), [filters.types])
  const pickupKey = pickup?.isValid() ? formatSearchDateTimeParam(pickup) : ''
  const dropoffKey = dropoff?.isValid() ? formatSearchDateTimeParam(dropoff) : ''

  useEffect(() => {
    const q = new URLSearchParams(routeLocation.search)
    const st = useSearchStore.getState()

    const rawLoc = q.get('location')
    const locTrim = rawLoc?.trim()
    if (locTrim && locTrim !== st.location) setLocation(locTrim)

    const vtRaw = q.get('vt')
    if (vtRaw && isValidVehicleType(vtRaw)) {
      if (st.filters.vehicleType !== vtRaw) setFilter({ vehicleType: vtRaw })
    } else if (st.filters.vehicleType !== 'all') {
      setFilter({ vehicleType: 'all' })
    }

    const typesCsv = q.get('types')
    const typesParsed = typesCsv?.split(',').filter(Boolean)
    if (typesParsed?.length) {
      const incoming = [...typesParsed].sort().join('|')
      const existing = [...st.filters.types].sort().join('|')
      if (incoming !== existing) setFilter({ types: typesParsed })
    } else if (st.filters.types.length > 0) {
      setFilter({ types: [] })
    }

    const puParsed = parseSearchDateTimeParam(q.get('pickup'), 'pickup')
    const drParsed = parseSearchDateTimeParam(q.get('dropoff'), 'dropoff')

    if (puParsed?.isValid() && drParsed?.isValid()) {
      const samePu =
        st.pickup?.isValid() && formatSearchDateTimeParam(st.pickup) === formatSearchDateTimeParam(puParsed)
      const sameDr =
        st.dropoff?.isValid() && formatSearchDateTimeParam(st.dropoff) === formatSearchDateTimeParam(drParsed)
      if (!samePu || !sameDr) setDates(puParsed, drParsed)
    } else if (puParsed?.isValid()) {
      const defDrop = withDefaultDropoffTime(puParsed.startOf('day').add(3, 'day'))
      const samePu =
        st.pickup?.isValid() && formatSearchDateTimeParam(st.pickup) === formatSearchDateTimeParam(puParsed)
      const sameDr =
        st.dropoff?.isValid() &&
        formatSearchDateTimeParam(st.dropoff) === formatSearchDateTimeParam(defDrop)
      if (!samePu || !sameDr) setDates(puParsed, defDrop)
    }
  }, [routeLocation.search, setLocation, setDates, setFilter])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('location', location)
    if (pickup?.isValid()) params.set('pickup', formatSearchDateTimeParam(pickup))
    if (dropoff?.isValid()) params.set('dropoff', formatSearchDateTimeParam(dropoff))
    if (filters.types.length) params.set('types', filters.types.join(','))
    if (filters.vehicleType !== 'all') params.set('vt', filters.vehicleType)

    const next = params.toString()
    const dest = next ? `?${next}` : ''
    if (areUrlSearchQueriesEqual(routeLocation.search ?? '', dest)) return
    setSearchParams(params, { replace: true })
  }, [
    location,
    pickupKey,
    dropoffKey,
    filtersTypesKey,
    filters.vehicleType,
    setSearchParams,
    routeLocation.search,
    pickup,
    dropoff,
    filters.types,
  ])

  const handleOpenVehicle = useCallback(
    (c: Car) => {
      const path = `/cars/${c.id}`
      prefetchPath(path)
      navigate(path)
    },
    [navigate],
  )

  return (
    <SearchResultsShell
      toolbar={
        <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 }, ...containerGutters }}>
          <BrowseCarSearch />
        </Container>
      }
      hits={hits}
      vehiclesLoading={vehiclesLoading}
      searchLoading={searchLoading}
      vehiclesFatalError={vehiclesFatalError}
      vehiclesError={vehiclesError}
      searchError={searchError}
      availabilityApplied={availabilityApplied}
      refetchVehicles={refetchVehicles}
      refetchSearch={refetchSearch}
      onNavigate={handleOpenVehicle}
      onReserve={handleOpenVehicle}
      showVehicleTypeChips
      emptyTitle={
        availabilityApplied ? t('search.nothingDates') : t('search.noMatchFilters')
      }
      emptyDescription={
        availabilityApplied ? t('search.tryDatesDesc') : t('search.tryFiltersDesc')
      }
    />
  )
}
