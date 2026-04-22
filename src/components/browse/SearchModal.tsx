import CloseRounded from '@mui/icons-material/CloseRounded'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import DatePicker from './DatePicker'

const MOCK_LOCATIONS = [
  'Manila',
  'Metro Manila',
  'Makati',
  'BGC, Taguig',
  'Quezon City',
  'Pasig',
  'Cebu City',
  'Davao City',
  'Clark, Pampanga',
  'Bonifacio Global City',
]

export type SearchModalProps = {
  open: boolean
  onClose: () => void
  location: string
  onLocationChange: (value: string) => void
  pickupDate: string
  onPickupChange: (value: string) => void
  returnDate: string
  onReturnChange: (value: string) => void
  onSearch: () => void
  minPickupDate: string
}

type Section = 'location' | 'pickup' | 'return'

export default function SearchModal({
  open,
  onClose,
  location,
  onLocationChange,
  pickupDate,
  onPickupChange,
  returnDate,
  onReturnChange,
  onSearch,
  minPickupDate,
}: SearchModalProps) {
  const [activeSection, setActiveSection] = useState<Section>('location')
  const panelRef = useRef<HTMLDivElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    const q = location.trim().toLowerCase()
    if (!q) return MOCK_LOCATIONS.slice(0, 5)
    return MOCK_LOCATIONS.filter((item) => item.toLowerCase().includes(q)).slice(0, 6)
  }, [location])

  useEffect(() => {
    if (open) {
      setActiveSection('location')
      const t = window.setTimeout(() => locationInputRef.current?.focus(), 180)
      return () => window.clearTimeout(t)
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
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const returnMin = pickupDate || minPickupDate

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handlePickupChange = (value: string) => {
    onPickupChange(value)
    if (!value) onReturnChange('')
    else if (returnDate && value && returnDate < value) {
      onReturnChange(value)
    }
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
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 sm:px-5">
              <h2 id="browse-search-title" className="text-base font-semibold text-neutral-900">
                Find a car
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
                aria-label="Close"
              >
                <CloseRounded />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-4 sm:px-5 sm:py-5">
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
                  ref={locationInputRef}
                  id="browse-location"
                  type="text"
                  autoComplete="off"
                  placeholder="Search location"
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  onFocus={() => setActiveSection('location')}
                  className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-0"
                />
                {activeSection === 'location' && suggestions.length > 0 && (
                  <ul
                    className="absolute left-0 right-0 top-full z-10 mt-2 max-h-48 overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
                    role="listbox"
                  >
                    {suggestions.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onLocationChange(item)
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

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <DatePicker
                  label="Pick-up"
                  value={pickupDate}
                  onChange={handlePickupChange}
                  min={minPickupDate}
                  onFocus={() => setActiveSection('pickup')}
                  isActive={activeSection === 'pickup'}
                />
                <DatePicker
                  label="Return"
                  value={returnDate}
                  onChange={onReturnChange}
                  min={returnMin}
                  onFocus={() => setActiveSection('return')}
                  isActive={activeSection === 'return'}
                  disabled={!pickupDate}
                />
              </div>
            </div>

            <div className="border-t border-neutral-100 px-4 py-3 sm:px-5 sm:py-4">
              <button
                type="button"
                onClick={onSearch}
                className="w-full rounded-xl bg-[#1A56DB] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1748b8] active:scale-[0.99]"
              >
                Search
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
