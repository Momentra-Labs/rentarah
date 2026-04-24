import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'

import { DEFAULT_SEARCH_LOCATION } from '../../constants/geo'
import { useSearchStore } from '../../store/useSearchStore'
import SearchBar from './SearchBar'
import SearchModal from './SearchModal'

function formatDateRange(pickup: Dayjs | null, dropoff: Dayjs | null): string | null {
  if (!pickup?.isValid() || !dropoff?.isValid()) return null
  const a = pickup.format('MMM D')
  const b = dropoff.format('MMM D')
  return `${a} - ${b}`
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
  const [draftPickup, setDraftPickup] = useState('')
  const [draftReturn, setDraftReturn] = useState('')

  const minPickup = useMemo(() => dayjs().format('YYYY-MM-DD'), [])

  const syncDraftFromStore = useCallback(() => {
    setDraftLocation(storeLocation)
    setDraftPickup(pickup?.isValid() ? pickup.format('YYYY-MM-DD') : '')
    setDraftReturn(dropoff?.isValid() ? dropoff.format('YYYY-MM-DD') : '')
  }, [storeLocation, pickup, dropoff])

  const handleOpen = () => {
    syncDraftFromStore()
    setOpen(true)
  }

  const handleClose = () => setOpen(false)

  const handleSearch = () => {
    const loc = draftLocation.trim()
    setLocation(loc.length ? loc : DEFAULT_SEARCH_LOCATION)

    const pu = draftPickup ? dayjs(draftPickup) : null
    let ret = draftReturn ? dayjs(draftReturn) : null
    if (pu && ret && ret.isBefore(pu, 'day')) {
      ret = pu.add(1, 'day')
    }
    if (pu && !ret) {
      ret = pu.add(3, 'day')
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
    return range ?? 'Pickup - Return'
  }, [pickup, dropoff])

  const showMidDot = Boolean(storeLocation.trim() && formatDateRange(pickup, dropoff))

  return (
    <>
      <SearchBar
        locationLabel={locationLabel}
        datesLabel={datesLabel}
        onOpen={handleOpen}
        modalOpen={open}
        showMidDot={showMidDot}
      />
      <SearchModal
        open={open}
        onClose={handleClose}
        location={draftLocation}
        onLocationChange={setDraftLocation}
        pickupDate={draftPickup}
        onPickupChange={setDraftPickup}
        returnDate={draftReturn}
        onReturnChange={setDraftReturn}
        onSearch={handleSearch}
        minPickupDate={minPickup}
      />
    </>
  )
}
