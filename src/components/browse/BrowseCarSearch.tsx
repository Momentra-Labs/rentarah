import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'

import { DEFAULT_SEARCH_LOCATION } from '../../constants/geo'
import { useSearchStore } from '../../store/useSearchStore'
import { withDefaultDropoffTime } from '../../utils/dateUtils'
import { formatSearchSummaryLine } from '../../utils/tripSummaryFormat'
import SearchBar from './SearchBar'
import SearchModal from './SearchModal'

function formatDateRange(pickup: Dayjs | null, dropoff: Dayjs | null): string | null {
  if (!pickup?.isValid() || !dropoff?.isValid()) return null
  const a = pickup.format('MMM D · h:mm A')
  const b = dropoff.format('MMM D · h:mm A')
  return `${a} – ${b}`
}

function shortLocation(label: string): string {
  const t = label.trim()
  if (!t) return ''
  const first = t.split(',')[0]?.trim() ?? t
  return first
}

export default function BrowseCarSearch() {
  const storeLocation = useSearchStore((s) => s.location)
  const pickup = useSearchStore((s) => s.pickup)
  const dropoff = useSearchStore((s) => s.dropoff)
  const setLocation = useSearchStore((s) => s.setLocation)
  const setDates = useSearchStore((s) => s.setDates)

  const [open, setOpen] = useState(false)
  const [draftLocation, setDraftLocation] = useState(storeLocation)
  const [draftPickup, setDraftPickup] = useState<Dayjs | null>(null)
  const [draftDropoff, setDraftDropoff] = useState<Dayjs | null>(null)

  const syncDraftFromStore = useCallback(() => {
    setDraftLocation(storeLocation)
    setDraftPickup(pickup?.isValid() ? pickup : null)
    setDraftDropoff(dropoff?.isValid() ? dropoff : null)
  }, [storeLocation, pickup, dropoff])

  const handleOpen = () => {
    syncDraftFromStore()
    setOpen(true)
  }

  const handleClose = () => setOpen(false)

  const handleDraftPickupChange = useCallback((next: Dayjs | null) => {
    if (!next || !next.isValid()) {
      setDraftPickup(null)
      setDraftDropoff(null)
      return
    }
    let adjusted = next
    const now = dayjs()
    if (adjusted.isBefore(now)) {
      adjusted = now.add(1, 'minute').second(0).millisecond(0)
    }
    setDraftPickup(adjusted)
    setDraftDropoff((prev) => {
      if (!prev?.isValid()) return withDefaultDropoffTime(adjusted.startOf('day').add(3, 'day'))
      if (!prev.startOf('day').isAfter(adjusted.startOf('day'), 'day')) {
        return withDefaultDropoffTime(adjusted.startOf('day').add(1, 'day'))
      }
      return prev
    })
  }, [])

  const handleSearch = () => {
    const loc = draftLocation.trim()
    setLocation(loc.length ? loc : DEFAULT_SEARCH_LOCATION)

    const pu = draftPickup
    let ret = draftDropoff
    if (!pu?.isValid()) {
      setOpen(false)
      return
    }
    if (!ret?.isValid()) {
      ret = withDefaultDropoffTime(pu.startOf('day').add(3, 'day'))
    }
    if (!ret.startOf('day').isAfter(pu.startOf('day'), 'day')) {
      ret = withDefaultDropoffTime(pu.startOf('day').add(1, 'day'))
    }
    setDates(pu, ret)
    setOpen(false)
  }

  const locationLabel = useMemo(() => {
    if (!storeLocation.trim()) return 'Where to?'
    return shortLocation(storeLocation)
  }, [storeLocation])

  const datesLabel = useMemo(() => {
    const range = formatDateRange(pickup, dropoff)
    return range ?? 'Pickup – Return'
  }, [pickup, dropoff])

  const showMidDot = Boolean(storeLocation.trim() && formatDateRange(pickup, dropoff))

  const compactSummaryLine = useMemo(() => {
    const locUse = storeLocation.trim() ? storeLocation : DEFAULT_SEARCH_LOCATION
    return formatSearchSummaryLine(locUse, pickup, dropoff)
  }, [storeLocation, pickup, dropoff])

  return (
    <>
      <SearchBar
        locationLabel={locationLabel}
        datesLabel={datesLabel}
        compactSummaryLine={compactSummaryLine}
        onOpen={handleOpen}
        modalOpen={open}
        showMidDot={showMidDot}
      />
      <SearchModal
        open={open}
        onClose={handleClose}
        location={draftLocation}
        onLocationChange={setDraftLocation}
        pickup={draftPickup}
        onPickupChange={handleDraftPickupChange}
        dropoff={draftDropoff}
        onDropoffChange={setDraftDropoff}
        onSearch={handleSearch}
        minPickup={dayjs()}
      />
    </>
  )
}
