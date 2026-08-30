import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo } from 'react'
import { Link as RouterLink, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import BrowseCarSearch from '@/components/browse/BrowseCarSearch'
import SearchResultsShell from '@/components/browse/SearchResultsShell'
import { useListingSearch } from '@/hooks/useListingSearch'
import { useT } from '@/hooks/useT'
import { useVehicles } from '@/hooks/useVehicles'
import { prefetchPath } from '@/lib/routePrefetch'
import { useSearchStore } from '@/store/useSearchStore'
import { containerGutters } from '@/theme/pageStyles'
import type { Car, VehicleType } from '@/types'
import {
  formatSearchDateTimeParam,
  parseSearchDateTimeParam,
  withDefaultDropoffTime,
} from '@/utils/dateUtils'
import { isValidVehicleType } from '@/utils/vehicleUtils'

export default function VehicleModelSearchPage() {
  const t = useT()
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const [searchParams] = useSearchParams()

  const make = (searchParams.get('make') ?? '').trim()
  const model = (searchParams.get('model') ?? '').trim()
  const vtRaw = searchParams.get('vt') ?? ''

  const modelKey = useMemo(() => {
    if (!make || !model || !isValidVehicleType(vtRaw)) return null
    return { make, model, vehicleType: vtRaw as VehicleType }
  }, [make, model, vtRaw])

  const { isLoading: vehiclesLoading, isError: vehiclesFatalError, error: vehiclesError, refetch: refetchVehicles } =
    useVehicles()
  const {
    hits,
    isLoading: searchLoading,
    error: searchError,
    refetch: refetchSearch,
    availabilityApplied,
  } = useListingSearch({ modelKey, enabled: modelKey != null })

  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)

  useEffect(() => {
    const q = new URLSearchParams(routeLocation.search)
    const st = useSearchStore.getState()
    const locTrim = q.get('location')?.trim()
    if (locTrim && locTrim !== st.location) setLocation(locTrim)

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
  }, [routeLocation.search, setLocation, setDates])

  const navigateToCar = useCallback(
    (c: Car) => {
      const path = `/cars/${c.id}`
      prefetchPath(path)
      navigate(path)
    },
    [navigate],
  )

  if (!modelKey) {
    return <Navigate to="/search" replace />
  }

  const displayModel = `${make} ${model}`

  return (
    <SearchResultsShell
      toolbar={
        <Container maxWidth="lg" sx={{ py: { xs: 1.5, md: 2 }, ...containerGutters }}>
          <Stack spacing={1.5}>
            <Button
              component={RouterLink}
              to="/search"
              startIcon={<ArrowBack />}
              size="small"
              onPointerDown={() => prefetchPath('/search')}
              sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
            >
              All vehicles
            </Button>
            <BrowseCarSearch />
          </Stack>
        </Container>
      }
      header={
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800} component="h1">
            {displayModel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare listings from different hosts. Pick dates and an area to check live availability.
          </Typography>
        </Stack>
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
      onNavigate={navigateToCar}
      onReserve={navigateToCar}
      pageResetKey={`${make}|${model}|${vtRaw}`}
      emptyTitle={availabilityApplied ? t('search.nothingDates') : t('search.noHostListings')}
      emptyDescription={
        availabilityApplied ? t('search.tryModelDatesDesc') : t('search.tryModelFiltersDesc')
      }
    />
  )
}
