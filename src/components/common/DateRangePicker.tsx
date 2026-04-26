import { Stack, TextField, Typography } from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import type { SxProps, Theme } from '@mui/material/styles'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import { withDefaultDropoffTime } from '../../utils/dateUtils'

export interface DateRangePickerProps {
  pickup: Dayjs | null
  dropoff: Dayjs | null
  onChange?: (range: { pickup: Dayjs | null; dropoff: Dayjs | null }) => void
  pickupLabel?: string
  dropoffLabel?: string
  minDate?: Dayjs | null
  spacing?: number
  /** Use `small` on narrow layouts for a shorter control height */
  size?: 'small' | 'medium'
  /**
   * When true, pickers always stack vertically so values (e.g. “10:00 AM”) are not clipped in narrow cards.
   * When false, side‑by‑side from `sm` breakpoint up (default).
   */
  stacked?: boolean
  /** Shown under the fields; set false when the parent renders its own hint. */
  showPolicyCaption?: boolean
  slotProps?: {
    pickup?: Partial<TextFieldProps>
    dropoff?: Partial<TextFieldProps>
    textField?: Partial<TextFieldProps>
  }
}

/** Pick-up and return with date + time (MUI X DateTimePickers). */
export default function DateRangePicker({
  pickup,
  dropoff,
  onChange,
  pickupLabel = 'Pick-up',
  dropoffLabel = 'Return',
  minDate,
  slotProps,
  spacing = 2,
  size = 'medium',
  stacked = false,
  showPolicyCaption = true,
}: DateRangePickerProps) {
  const now = dayjs()

  const handlePickup = (next: Dayjs | null) => {
    if (!next || !next.isValid()) {
      onChange?.({ pickup: next, dropoff })
      return
    }
    let adjusted = next
    if (minDate?.isValid() && adjusted.startOf('day').isBefore(minDate.startOf('day'))) {
      adjusted = minDate
    }
    if (adjusted.isBefore(now)) {
      adjusted = now.add(1, 'minute').second(0).millisecond(0)
    }

    let nextDropoff = dropoff
    if (dropoff?.isValid()) {
      const pDay = adjusted.startOf('day')
      const dDay = dropoff.startOf('day')
      if (!dDay.isAfter(pDay, 'day')) {
        nextDropoff = withDefaultDropoffTime(pDay.add(1, 'day'))
      }
    }
    onChange?.({ pickup: adjusted, dropoff: nextDropoff })
  }

  const handleDropoff = (next: Dayjs | null) => {
    if (!next || !next.isValid()) {
      onChange?.({ pickup, dropoff: next })
      return
    }
    let adjusted = next
    const nextPickup = pickup
    if (pickup?.isValid()) {
      const pDay = pickup.startOf('day')
      const dDay = adjusted.startOf('day')
      if (!dDay.isAfter(pDay, 'day')) {
        adjusted = withDefaultDropoffTime(pDay.add(1, 'day'))
      }
    }
    if (pickup?.isValid() && adjusted.isBefore(pickup)) {
      adjusted = withDefaultDropoffTime(pickup.startOf('day').add(1, 'day'))
    }
    onChange?.({ pickup: nextPickup, dropoff: adjusted })
  }

  const dropoffMin = pickup?.isValid() ? pickup.startOf('day').add(1, 'day') : minDate ?? undefined

  const { sx: tfCommonSx, ...tfCommonRest } = slotProps?.textField ?? {}
  const pickupField = (slotProps?.pickup ?? {}) as TextFieldProps
  const dropoffField = (slotProps?.dropoff ?? {}) as TextFieldProps
  const { sx: pickupSx, ...pickupRest } = pickupField
  const { sx: dropoffSx, ...dropoffRest } = dropoffField

  const fieldSxBase = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
    },
    '& .MuiOutlinedInput-input': {
      paddingRight: '2.5rem',
    },
  }

  const pickupSxMerged = [fieldSxBase, tfCommonSx, pickupSx].filter(Boolean) as SxProps<Theme>
  const dropoffSxMerged = [fieldSxBase, tfCommonSx, dropoffSx].filter(Boolean) as SxProps<Theme>

  return (
    <Stack spacing={spacing} sx={{ width: '100%' }}>
      <Stack
        spacing={spacing}
        direction={stacked ? 'column' : { xs: 'column', sm: 'row' }}
        sx={{
          '& .MuiFormControl-root': stacked
            ? { flex: 1, width: '100%' }
            : { flex: 1, minWidth: { xs: 0, sm: 200 } },
        }}
      >
        <DateTimePicker
          ampm
          views={['year', 'month', 'day', 'hours', 'minutes']}
          inputFormat="MM/DD/YYYY h:mm A"
          label={pickupLabel}
          value={pickup}
          onChange={handlePickup}
          minDate={minDate ?? undefined}
          renderInput={(params) => (
            <TextField
              {...params}
              {...tfCommonRest}
              {...pickupRest}
              size={size}
              fullWidth
              sx={pickupSxMerged}
            />
          )}
        />
        <DateTimePicker
          ampm
          views={['year', 'month', 'day', 'hours', 'minutes']}
          inputFormat="MM/DD/YYYY h:mm A"
          label={dropoffLabel}
          value={dropoff}
          onChange={handleDropoff}
          minDate={dropoffMin ?? minDate ?? undefined}
          renderInput={(params) => (
            <TextField
              {...params}
              {...tfCommonRest}
              {...dropoffRest}
              size={size}
              fullWidth
              sx={dropoffSxMerged}
            />
          )}
        />
      </Stack>
      {showPolicyCaption ? (
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
          Pick-up and return include time for meetups. Trip length is still priced by calendar day.
        </Typography>
      ) : null}
    </Stack>
  )
}
