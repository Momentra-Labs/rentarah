import type { Dayjs } from 'dayjs'

import type { SearchFilters } from '@/types'
import {
  formatSearchDateTimeParam,
  parseSearchDateTimeParam,
  withDefaultDropoffTime,
} from '@/utils/dateUtils'
import { isValidVehicleType } from '@/utils/vehicleUtils'

export type BrowseSearchUrlStore = {
  location: string
  pickup: Dayjs | null
  dropoff: Dayjs | null
  filters: Pick<SearchFilters, 'types' | 'vehicleType'>
  setLocation: (location: string) => void
  setDates: (pickup: Dayjs | null, dropoff: Dayjs | null) => void
  setFilter: (partial: Partial<Pick<SearchFilters, 'types' | 'vehicleType'>>) => void
}

/** Copy browse query params into the search store (URL is source on navigation). */
export function applyBrowseUrlToStore(search: string, store: BrowseSearchUrlStore): void {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

  const locTrim = q.get('location')?.trim()
  if (locTrim && locTrim !== store.location) store.setLocation(locTrim)

  const vtRaw = q.get('vt')
  if (vtRaw && isValidVehicleType(vtRaw)) {
    if (store.filters.vehicleType !== vtRaw) store.setFilter({ vehicleType: vtRaw })
  } else if (store.filters.vehicleType !== 'all') {
    store.setFilter({ vehicleType: 'all' })
  }

  const typesCsv = q.get('types')
  const typesParsed = typesCsv?.split(',').filter(Boolean)
  if (typesParsed?.length) {
    const incoming = [...typesParsed].sort().join('|')
    const existing = [...store.filters.types].sort().join('|')
    if (incoming !== existing) store.setFilter({ types: typesParsed })
  } else if (store.filters.types.length > 0) {
    store.setFilter({ types: [] })
  }

  const puParsed = parseSearchDateTimeParam(q.get('pickup'), 'pickup')
  const drParsed = parseSearchDateTimeParam(q.get('dropoff'), 'dropoff')

  if (puParsed?.isValid() && drParsed?.isValid()) {
    const samePu =
      store.pickup?.isValid() &&
      formatSearchDateTimeParam(store.pickup) === formatSearchDateTimeParam(puParsed)
    const sameDr =
      store.dropoff?.isValid() &&
      formatSearchDateTimeParam(store.dropoff) === formatSearchDateTimeParam(drParsed)
    if (!samePu || !sameDr) store.setDates(puParsed, drParsed)
  } else if (puParsed?.isValid()) {
    const defDrop = withDefaultDropoffTime(puParsed.startOf('day').add(3, 'day'))
    const samePu =
      store.pickup?.isValid() &&
      formatSearchDateTimeParam(store.pickup) === formatSearchDateTimeParam(puParsed)
    const sameDr =
      store.dropoff?.isValid() &&
      formatSearchDateTimeParam(store.dropoff) === formatSearchDateTimeParam(defDrop)
    if (!samePu || !sameDr) store.setDates(puParsed, defDrop)
  }
}

/** Serialize the current browse store into `/search` query params. */
export function buildBrowseSearchParams(store: {
  location: string
  pickup: Dayjs | null
  dropoff: Dayjs | null
  filters: Pick<SearchFilters, 'types' | 'vehicleType'>
}): URLSearchParams {
  const params = new URLSearchParams()
  const loc = store.location.trim()
  if (loc) params.set('location', loc)
  if (store.pickup?.isValid()) params.set('pickup', formatSearchDateTimeParam(store.pickup))
  if (store.dropoff?.isValid()) params.set('dropoff', formatSearchDateTimeParam(store.dropoff))
  if (store.filters.types.length) params.set('types', store.filters.types.join(','))
  if (store.filters.vehicleType !== 'all') params.set('vt', store.filters.vehicleType)
  return params
}
