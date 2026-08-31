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
import { applyBrowseUrlToStore, buildBrowseSearchParams } from '@/utils/browseSearchUrl'
import { formatSearchDateTimeParam } from '@/utils/dateUtils'
import { areUrlSearchQueriesEqual } from '@/utils/urlQueryCompare'

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

  /**
   * Apply the URL first (layout), then write the store back using getState().
   * Writing the first-render snapshot used to replace `location=Philippines` with the
   * default Metro Manila city.
   */
  useLayoutEffect(() => {
    applyBrowseUrlToStore(routeLocation.search, useSearchStore.getState())
  }, [routeLocation.search, setLocation, setDates, setFilter])

  useEffect(() => {
    const params = buildBrowseSearchParams(useSearchStore.getState())
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
