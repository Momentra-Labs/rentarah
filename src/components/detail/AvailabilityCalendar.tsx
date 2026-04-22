import { Box, Paper, Stack, Typography } from '@mui/material'
import { CalendarPicker } from '@mui/x-date-pickers/CalendarPicker'
import { PickersDay } from '@mui/x-date-pickers/PickersDay'
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import type { Car } from '../../types'
import { useDateValidation } from '../../hooks/useDateValidation'
import { generateDateRangeInclusive } from '../../utils/dateUtils'

export interface AvailabilityCalendarProps {
  car: Car
  pickup: Dayjs | null
  dropoff: Dayjs | null
}

export default function AvailabilityCalendar({ car, pickup, dropoff }: AvailabilityCalendarProps) {
  const { shouldDisableDate } = useDateValidation(car)

  const rangeSet = new Set<string>()
  if (pickup?.isValid() && dropoff?.isValid()) {
    generateDateRangeInclusive(pickup, dropoff).forEach((d) => rangeSet.add(d))
  }

  const renderDay = (
    day: Dayjs,
    _selectedDays: Dayjs[],
    pickersDayProps: PickersDayProps<Dayjs>,
  ) => {
    const iso = day.format('YYYY-MM-DD')
    const booked = car.bookedDates.includes(iso)
    const inSelectedRange = rangeSet.has(iso)

    return (
      <PickersDay
        {...pickersDayProps}
        sx={{
          ...pickersDayProps.sx,
          ...(booked && {
            bgcolor: 'rgba(220, 38, 38, 0.14)',
            color: 'error.dark',
            fontWeight: 700,
          }),
          ...(inSelectedRange &&
            !booked && {
              bgcolor: 'rgba(26, 86, 219, 0.14)',
              color: 'primary.dark',
              fontWeight: 700,
            }),
        }}
      />
    )
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Availability
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Booked nights and past dates can&apos;t be selected. Your trip range is highlighted when you pick dates in the sidebar.
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          display: 'inline-block',
          maxWidth: '100%',
          '& .MuiCalendarPicker-root': { width: '100%' },
        }}
      >
        <CalendarPicker
          date={pickup?.isValid() ? pickup : dayjs()}
          onChange={() => {}}
          readOnly
          disablePast
          shouldDisableDate={shouldDisableDate}
          renderDay={renderDay}
        />
      </Paper>
      <Stack direction="row" spacing={3} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'rgba(220, 38, 38, 0.35)' }} />
          <Typography variant="caption" color="text.secondary">
            Unavailable (booked)
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'rgba(26, 86, 219, 0.25)' }} />
          <Typography variant="caption" color="text.secondary">
            Your selected range
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}
