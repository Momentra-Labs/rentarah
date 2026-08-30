import CloseRounded from '@mui/icons-material/CloseRounded'
import { Stack, TextField } from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AnimatePresence, motion } from 'framer-motion'
import type { Dayjs } from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import PhPickupCityAutocomplete from '@/components/search/PhPickupCityAutocomplete'
import { useT } from '@/hooks/useT'
import { pickerFocusOutlineSx } from '@/styles/pickerFocus'

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
  const t = useT()
  const [activeSection, setActiveSection] = useState<Section>('location')
  const panelRef = useRef<HTMLDivElement>(null)

  const dropoffMin = useMemo(() => {
    if (pickup?.isValid()) return pickup.startOf('day').add(1, 'day')
    return minPickup
  }, [pickup, minPickup])

  useEffect(() => {
    if (open) setActiveSection('location')
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
            className="absolute inset-0 bg-black/40"
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
                {t('search.editSearch')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
                aria-label={t('common.close')}
              >
                <CloseRounded aria-hidden />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-4 sm:px-5 sm:py-5 pb-2">
              <div
                className={[
                  'rounded-2xl border-2 px-3 py-3 transition-colors duration-150',
                  activeSection === 'location'
                    ? 'border-neutral-900 bg-neutral-50 shadow-inner'
                    : 'border-transparent bg-neutral-100/80 hover:bg-neutral-100',
                ].join(' ')}
              >
                <PhPickupCityAutocomplete
                  value={location}
                  onChange={onLocationChange}
                  onFocus={() => setActiveSection('location')}
                  onSelect={() => setActiveSection('pickup')}
                />
              </div>

              <Stack spacing={2} sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                <DateTimePicker
                  ampm
                  views={['year', 'month', 'day', 'hours', 'minutes']}
                  minutesStep={30}
                  inputFormat="MMM D, YYYY · h:mm A"
                  label={t('search.pickupLabel')}
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
                  inputFormat="MMM D, YYYY · h:mm A"
                  label={t('search.returnLabel')}
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
                {t('search.timesHint')}
              </p>
            </div>

            <div className="sticky bottom-0 z-[2] shrink-0 border-t border-neutral-100 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:px-5 sm:pb-4">
              <button
                type="button"
                onClick={onSearch}
                className="w-full rounded-xl bg-[#1A56DB] py-3.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(26,86,219,0.35)] transition hover:bg-[#1748b8] active:scale-[0.99]"
              >
                {t('search.searchListings')}
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
