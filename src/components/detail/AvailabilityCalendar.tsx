import { Box, Paper, Stack, Typography } from '@mui/material'
import { CalendarPicker } from '@mui/x-date-pickers/CalendarPicker'
import { PickersDay } from '@mui/x-date-pickers/PickersDay'
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import type { Car } from '../../types'
import { useDateValidation } from '../../hooks/useDateValidation'
import { generateDateRangeInclusive } from '../../utils/dateUtils'

/** ~MUI DayPicker weeks area: (DAY_SIZE + 2*DAY_MARGIN) * 6 rows */
const CALENDAR_GRID_MIN_HEIGHT = (36 + 4) * 6

/** Shared 7-column grid — aligns weekday labels with date cells. */
const weekGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box' as const,
}

/** Readable single-month width; paired with legend column on desktop so the card isn’t half empty. */
const CALENDAR_COLUMN_MAX_WIDTH = 360

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
        disableMargin
        sx={{
          ...pickersDayProps.sx,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          height: 'auto',
          aspectRatio: '1',
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

  const paperCalendarSx = {
    py: { xs: 1.5, sm: 2 },
    px: { xs: 2, sm: 2 },
    borderRadius: 2,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    overflow: { xs: 'hidden', sm: 'visible' },
    boxSizing: 'border-box',
    bgcolor: 'background.paper',
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: { xs: 'stretch', md: 'flex-start' },
    gap: { xs: 2, md: 0 },
    '& .MuiCalendarPicker-root': {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      maxHeight: 'none',
      margin: 0,
      overflowX: { xs: 'hidden', sm: 'visible' },
    },
    '& .MuiCalendarPicker-viewTransitionContainer': {
      width: '100%',
      maxWidth: '100%',
    },
    '& .MuiPickersCalendarHeader-root': {
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: { xs: 0, sm: 0.5 },
      marginBottom: { xs: 1, sm: 1.5 },
      maxWidth: '100%',
      width: '100%',
    },
    '& .MuiPickersCalendarHeader-labelContainer': {
      minWidth: 0,
      flexShrink: 1,
    },
    '& .MuiPickersCalendarHeader-label': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .MuiDayPicker-header': {
      ...weekGridSx,
      columnGap: { xs: 0.25, sm: 0.5 },
      marginBottom: 0.5,
    },
    '& .MuiDayPicker-weekDayLabel': {
      margin: 0,
      padding: 0,
      width: '100%',
      minWidth: 0,
      fontSize: { xs: '0.68rem', sm: '0.75rem' },
      fontWeight: 600,
      textAlign: 'center',
    },
    '& .PrivatePickersSlideTransition-root': {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
    },
    '& .MuiDayPicker-slideTransition': {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      minHeight: CALENDAR_GRID_MIN_HEIGHT,
    },
    '& .MuiDayPicker-monthContainer': {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      overflowX: { xs: 'hidden', sm: 'visible' },
    },
    '& .MuiDayPicker-weekContainer': {
      ...weekGridSx,
      columnGap: { xs: 0.25, sm: 0.5 },
      rowGap: { xs: 0.25, sm: 0.5 },
      marginTop: 0,
      marginBottom: 0,
    },
    '& .MuiPickersDay-root': {
      justifySelf: 'center',
      alignSelf: 'center',
      width: '100%',
      maxWidth: '100%',
    },
  } as const

  return (
    <Box sx={{ mt: 4, width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <Typography variant="h4" sx={{ mb: 2, fontSize: { xs: '1.25rem', sm: '2rem' } }}>
        Availability
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Booked nights and past dates can&apos;t be selected. Your trip range is highlighted when you pick dates in the sidebar.
      </Typography>
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: { xs: 'hidden', sm: 'visible' },
        }}
      >
        <Paper variant="outlined" sx={paperCalendarSx}>
          {/** Narrow column for the month grid; legend sits beside it from `md` up so the card isn’t mostly empty whitespace. */}
          <Box
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', md: CALENDAR_COLUMN_MAX_WIDTH },
              flexShrink: 0,
              minWidth: 0,
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
          </Box>

          <Stack
            spacing={2}
            sx={{
              flex: { md: 1 },
              minWidth: 0,
              width: { xs: '100%', md: 'auto' },
              borderLeft: { xs: 'none', md: '1px solid' },
              borderColor: 'divider',
              pl: { xs: 0, md: 3 },
              ml: { xs: 0, md: 0 },
              pt: { xs: 0.5, md: 1 },
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ display: { xs: 'none', md: 'block' } }}>
              Legend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, mb: 0.5 }}>
              Dates update when you change your trip in the booking panel.
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'rgba(220, 38, 38, 0.35)', flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary">
                  Unavailable (booked)
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'rgba(26, 86, 219, 0.25)', flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary">
                  Your selected range
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
