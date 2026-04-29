import CloseRounded from '@mui/icons-material/CloseRounded'
import { Stack, TextField } from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AnimatePresence, motion } from 'framer-motion'
import type { Dayjs } from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { pickerFocusOutlineSx } from '../../styles/pickerFocus'

const MOCK_LOCATIONS = [
  'Manila',
  'Metro Manila',
  'Makati',
  'BGC, Taguig',
  'Quezon City',
  'Pasig',
  'Cebu City',
  'Davao City',
  'Iloilo City',
  'Baguio',
  'Cagayan de Oro',
  'Clark, Pampanga',
  'Bonifacio Global City',
  'Philippines',
]

export type SearchModalProps = {
  open: boolean
  onClose: () => void
  location: string
  onLocationChange: (value: string) => void
  pickup: Dayjs | null
  onPickupChange: (value: Dayjs | null) => void
  dropoff: Dayjs | null
  onDropoffChange: (value: Dayjs | null) => void
  onSearch: () => void
  minPickup: Dayjs
}

type Section = 'location' | 'pickup' | 'return'

export default function SearchModal({
  open,
  onClose,
  location,
  onLocationChange,
  pickup,
  onPickupChange,
  dropoff,
  onDropoffChange,
  onSearch,
  minPickup,
}: SearchModalProps) {
  const [activeSection, setActiveSection] = useState<Section>('location')
  /** Only show the location suggest list after the user has typed in this visit (not on open + focus). */
  const [locationQueryActive, setLocationQueryActive] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const dropoffMin = useMemo(() => {
    if (pickup?.isValid()) return pickup.startOf('day').add(1, 'day')
    return minPickup
  }, [pickup, minPickup])

  const suggestions = useMemo(() => {
    const q = location.trim().toLowerCase()
    if (!q) return []
    return MOCK_LOCATIONS.filter((item) => item.toLowerCase().includes(q)).slice(0, 8)
  }, [location])

  useEffect(() => {
    if (open) {
      setActiveSection('location')
      setLocationQueryActive(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      const go = () => window.scrollTo({ top: scrollY, behavior: 'auto' })
      go()
      requestAnimationFrame(() => {
        go()
        requestAnimationFrame(go)
      })
    }
  }, [open])

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handlePickupChange = (next: Dayjs | null) => {
    onPickupChange(next)
    if (!next) onDropoffChange(null)
  }

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="browse-search-overlay"
          className="fixed inset-0 z-[1300] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onMouseDown={handleBackdropMouseDown}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="browse-search-title"
            className="relative z-[1] flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-modal sm:mx-4 sm:max-h-[85vh] sm:rounded-3xl"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3 sm:px-5">
              <h2 id="browse-search-title" className="text-base font-semibold text-neutral-900">
                Find a car
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
                aria-label="Close"
              >
                <CloseRounded aria-hidden />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-4 sm:px-5 sm:py-5 pb-2">
              <div
                className={[
                  'relative rounded-2xl border-2 px-4 py-3 transition-colors duration-150',
                  activeSection === 'location'
                    ? 'border-neutral-900 bg-neutral-50 shadow-inner'
                    : 'border-transparent bg-neutral-100/80 hover:bg-neutral-100',
                ].join(' ')}
              >
                <label htmlFor="browse-location" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Location
                </label>
                <input
                  id="browse-location"
                  type="text"
                  autoComplete="off"
                  placeholder="Type to search city or area"
                  value={location}
                  onChange={(e) => {
                    onLocationChange(e.target.value)
                    setLocationQueryActive(true)
                  }}
                  onFocus={() => setActiveSection('location')}
                  className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB]"
                />
                {activeSection === 'location' && locationQueryActive && suggestions.length > 0 && (
                  <ul
                    className="absolute left-0 right-0 top-full z-10 mt-2 max-h-48 overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
                    role="listbox"
                    aria-label="Location suggestions"
                  >
                    {suggestions.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onLocationChange(item)
                            setLocationQueryActive(false)
                            setActiveSection('pickup')
                          }}
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Stack spacing={2} sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                <DateTimePicker
                  ampm
                  views={['year', 'month', 'day', 'hours', 'minutes']}
                  minutesStep={30}
                  inputFormat="MM/DD/YYYY hh:mm A"
                  label="Pick-up date & time"
                  value={pickup}
                  onChange={handlePickupChange}
                  minDate={minPickup}
                  onOpen={() => setActiveSection('pickup')}
                  renderInput={(params) => {
                    const sectionSx =
                      activeSection === 'pickup'
                        ? {
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.87)', borderWidth: 2 },
                          }
                        : {}
                    const merged = [
                      pickerFocusOutlineSx,
                      params.sx ?? {},
                      sectionSx,
                    ] as TextFieldProps['sx']
                    return (
                      <TextField
                        {...params}
                        onFocus={() => setActiveSection('pickup')}
                        InputLabelProps={{ ...params.InputLabelProps, sx: { fontWeight: 600 } }}
                        sx={merged}
                      />
                    )
                  }}
                />
                <DateTimePicker
                  ampm
                  views={['year', 'month', 'day', 'hours', 'minutes']}
                  minutesStep={30}
                  inputFormat="MM/DD/YYYY hh:mm A"
                  label="Return date & time"
                  value={dropoff}
                  onChange={onDropoffChange}
                  minDate={dropoffMin}
                  disabled={!pickup}
                  onOpen={() => setActiveSection('return')}
                  renderInput={(params) => {
                    const sectionSx =
                      activeSection === 'return'
                        ? {
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.87)', borderWidth: 2 },
                          }
                        : {}
                    const merged = [
                      pickerFocusOutlineSx,
                      params.sx ?? {},
                      sectionSx,
                    ] as TextFieldProps['sx']
                    return (
                      <TextField
                        {...params}
                        onFocus={() => setActiveSection('return')}
                        InputLabelProps={{ ...params.InputLabelProps, sx: { fontWeight: 600 } }}
                        sx={merged}
                      />
                    )
                  }}
                />
              </Stack>
              <p className="text-xs leading-snug text-neutral-500">
                Choose times for pick-up and hand-back. Trip length is still counted by calendar day.
              </p>
            </div>

            <div className="sticky bottom-0 z-[2] shrink-0 border-t border-neutral-100 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-5 sm:pb-4">
              <button
                type="button"
                onClick={onSearch}
                className="w-full rounded-xl bg-[#1A56DB] py-3.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(26,86,219,0.35)] transition hover:bg-[#1748b8] active:scale-[0.99]"
              >
                Search listings
              </button>
            </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
