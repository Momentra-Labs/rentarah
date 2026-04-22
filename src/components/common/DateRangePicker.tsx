import { Stack, TextField } from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import type { Dayjs } from 'dayjs'

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
  slotProps?: {
    pickup?: Partial<TextFieldProps>
    dropoff?: Partial<TextFieldProps>
    textField?: Partial<TextFieldProps>
  }
}

/** Pickup + return with two MUI X DatePickers; wrap app in LocalizationProvider + AdapterDayjs. */
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
}: DateRangePickerProps) {
  const handlePickup = (next: Dayjs | null) => {
    if (!next || !next.isValid()) {
      onChange?.({ pickup: next, dropoff })
      return
    }
    let nextDropoff = dropoff
    if (dropoff?.isValid() && !dropoff.isAfter(next, 'day')) {
      nextDropoff = next.add(1, 'day')
    }
    onChange?.({ pickup: next, dropoff: nextDropoff })
  }

  const handleDropoff = (next: Dayjs | null) => {
    if (!next || !next.isValid()) {
      onChange?.({ pickup, dropoff: next })
      return
    }
    let nextPickup = pickup
    if (pickup?.isValid() && next.isBefore(pickup, 'day')) {
      nextPickup = next.subtract(1, 'day')
    }
    onChange?.({ pickup: nextPickup, dropoff: next })
  }

  const dropoffMin = pickup?.isValid() ? pickup.add(1, 'day') : minDate ?? undefined

  const tfCommon = slotProps?.textField ?? {}

  return (
    <Stack
      spacing={spacing}
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ '& .MuiFormControl-root': { flex: 1, minWidth: 0 } }}
    >
      <DatePicker
        label={pickupLabel}
        value={pickup}
        onChange={handlePickup}
        minDate={minDate ?? undefined}
        renderInput={(params) => (
          <TextField
            {...params}
            {...tfCommon}
            {...(slotProps?.pickup ?? {})}
            size={size}
            fullWidth
          />
        )}
      />
      <DatePicker
        label={dropoffLabel}
        value={dropoff}
        onChange={handleDropoff}
        minDate={dropoffMin ?? minDate ?? undefined}
        renderInput={(params) => (
          <TextField
            {...params}
            {...tfCommon}
            {...(slotProps?.dropoff ?? {})}
            size={size}
            fullWidth
          />
        )}
      />
    </Stack>
  )
}
