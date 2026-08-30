import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { Key } from 'react'
import { CalendarPicker } from '@mui/x-date-pickers/CalendarPicker'
import { PickersDay } from '@mui/x-date-pickers/PickersDay'
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import type { Car } from '@/types'
import { useDateValidation } from '@/hooks/useDateValidation'
import { formatTripDateTimeHuman, generateRentalOccupancyDates } from '@/utils/dateUtils'

/** Compact day button — fixed size so every weekday column stays aligned. */
const DAY_SIZE = 36

const CALENDAR_COLUMN_MAX_WIDTH = 320

/** 7 equal columns — keeps Sun–Sat aligned even when a week has only 1–2 in-month days. */
const weekGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  width: '100%',
  maxWidth: CALENDAR_COLUMN_MAX_WIDTH,
  justifyItems: 'center',
  alignItems: 'center',
  boxSizing: 'border-box' as const,
}

export interface AvailabilityCalendarProps {
  car: Car
  pickup: Dayjs | null
  dropoff: Dayjs | null
}

export default function AvailabilityCalendar({ car, pickup, dropoff }: AvailabilityCalendarProps) {
  const { shouldDisableDate } = useDateValidation(car)

  const rangeSet = new Set<string>()
  if (pickup?.isValid() && dropoff?.isValid()) {
    generateRentalOccupancyDates(pickup, dropoff).forEach((d) => rangeSet.add(d))
  }

  const tripDays = rangeSet.size

  const renderDay = (
    day: Dayjs,
    _selectedDays: Dayjs[],
    pickersDayProps: PickersDayProps<Dayjs>,
  ) => {
    const iso = day.format('YYYY-MM-DD')
    const booked = car.bookedDates.includes(iso)
    const inSelectedRange = rangeSet.has(iso)
    const humanDay = day.format('MMM D')

    const { key: pickersReactKey, sx: pickerSxProp, ...pickersDayRest } = pickersDayProps as PickersDayProps<Dayjs> & {
      key?: Key | null | undefined
    }

    const dayKey = pickersReactKey ?? iso

    /*
     * MUI's hidden outside-month filler ignores `sx`, so its size can diverge from our days.
     * Render a same-size spacer ourselves so weeks with few in-month days (e.g. Aug 30–31)
     * still sit under the correct weekday columns.
     */
    if (pickersDayProps.outsideCurrentMonth && !pickersDayProps.showDaysOutsideCurrentMonth) {
      return (
        <Box
          key={dayKey}
          aria-hidden
          className="MuiPickersDay-root MuiPickersDay-hiddenDaySpacingFiller"
          sx={{
            width: DAY_SIZE,
            height: DAY_SIZE,
            minWidth: DAY_SIZE,
            maxWidth: DAY_SIZE,
            margin: 0,
            flex: '0 0 auto',
            pointerEvents: 'none',
          }}
        />
      )
    }

    return (
      <PickersDay
        key={dayKey}
        {...pickersDayRest}
        disableMargin
        title={
          booked
            ? `${humanDay} — already booked`
            : inSelectedRange
              ? `${humanDay} — part of your trip`
              : humanDay
        }
        sx={{
          ...pickerSxProp,
          width: DAY_SIZE,
          height: DAY_SIZE,
          minWidth: DAY_SIZE,
          maxWidth: DAY_SIZE,
          margin: 0,
          flex: '0 0 auto',
          fontSize: '0.8125rem',
          fontWeight: 650,
          borderRadius: '8px',
          boxSizing: 'border-box',
          ...(booked && {
            bgcolor: (t) => alpha(t.palette.error.main, 0.14),
            color: 'error.dark',
            fontWeight: 800,
            textDecoration: 'line-through',
            textDecorationThickness: 1.5,
          }),
          ...(inSelectedRange &&
            !booked && {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.18),
              color: 'primary.dark',
              fontWeight: 800,
              boxShadow: (t) => `inset 0 0 0 2px ${alpha(t.palette.primary.main, 0.45)}`,
            }),
        }}
      />
    )
  }

  const paperCalendarSx = {
    py: { xs: 1.5, sm: 2 },
    px: { xs: 1.5, sm: 2 },
    borderRadius: 3,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    overflow: 'visible',
    boxSizing: 'border-box',
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: (t: { palette: { primary: { main: string } } }) => alpha(t.palette.primary.main, 0.1),
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: { xs: 'stretch', md: 'flex-start' },
    gap: { xs: 2, md: 0 },
    '& .MuiCalendarPicker-root': {
      width: '100%',
      maxWidth: CALENDAR_COLUMN_MAX_WIDTH,
      minWidth: 0,
      maxHeight: 'none',
      height: 'auto',
      margin: 0,
      overflow: 'visible',
    },
    '& .MuiCalendarPicker-viewTransitionContainer': {
      width: '100%',
      overflow: 'visible',
    },
    '& .MuiPickersCalendarHeader-root': {
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 1,
      maxWidth: '100%',
      width: '100%',
    },
    '& .MuiPickersCalendarHeader-label': {
      fontWeight: 800,
      fontSize: '1rem',
      letterSpacing: '-0.02em',
    },
    '& .MuiDayPicker-header': {
      ...weekGridSx,
      mb: 0.5,
    },
    '& .MuiDayPicker-weekDayLabel': {
      width: DAY_SIZE,
      height: 28,
      margin: 0,
      fontSize: '0.75rem',
      fontWeight: 800,
      color: 'text.secondary',
      lineHeight: `${28}px`,
      justifySelf: 'center',
    },
    '& .PrivatePickersSlideTransition-root, & .MuiDayPicker-slideTransition': {
      width: '100%',
      maxWidth: CALENDAR_COLUMN_MAX_WIDTH,
      minWidth: 0,
      minHeight: 'unset',
      height: 'auto !important',
      overflow: 'visible !important',
    },
    '& .MuiDayPicker-monthContainer': {
      width: '100%',
      maxWidth: CALENDAR_COLUMN_MAX_WIDTH,
      minWidth: 0,
      position: 'relative',
      overflow: 'visible',
    },
    '& .MuiDayPicker-weekContainer': {
      ...weekGridSx,
      margin: 0,
      minHeight: DAY_SIZE,
    },
    '& .MuiPickersDay-root': {
      width: DAY_SIZE,
      height: DAY_SIZE,
      minWidth: DAY_SIZE,
      maxWidth: DAY_SIZE,
      margin: 0,
      justifySelf: 'center',
    },
    '& .MuiPickersDay-hiddenDaySpacingFiller': {
      width: DAY_SIZE,
      height: DAY_SIZE,
      minWidth: DAY_SIZE,
      maxWidth: DAY_SIZE,
      margin: 0,
      opacity: 0,
      pointerEvents: 'none',
    },
  } as const

  return (
    <Box sx={{ mt: 4, width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 0.75, fontWeight: 800, letterSpacing: '-0.02em' }}>
        When is it free?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55, fontWeight: 500, maxWidth: 560 }}>
        Red days are already taken. Blue days are the nights you selected above. Past days are greyed out.
      </Typography>

      {pickup?.isValid() && dropoff?.isValid() && (
        <Stack
          spacing={0.75}
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
            border: '1px solid',
            borderColor: (t) => alpha(t.palette.primary.main, 0.14),
          }}
        >
          <Typography variant="body2" fontWeight={800} color="primary.main">
            Your trip
          </Typography>
          <Typography variant="body2" fontWeight={650} color="text.primary" sx={{ lineHeight: 1.45 }}>
            {formatTripDateTimeHuman(pickup)}
            <Box component="span" sx={{ color: 'text.secondary', mx: 0.75, fontWeight: 600 }}>
              →
            </Box>
            {formatTripDateTimeHuman(dropoff)}
          </Typography>
          {tripDays > 0 && (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`${tripDays} billed ${tripDays === 1 ? 'day' : 'days'} (return day not charged)`}
              sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
            />
          )}
        </Stack>
      )}

      <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'visible' }}>
        <Paper variant="outlined" sx={paperCalendarSx}>
          <Box
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', md: CALENDAR_COLUMN_MAX_WIDTH },
              flexShrink: 0,
              minWidth: 0,
              overflow: 'visible',
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
            spacing={1.5}
            sx={{
              flex: { md: 1 },
              minWidth: 0,
              width: { xs: '100%', md: 'auto' },
              borderLeft: { xs: 'none', md: '1px solid' },
              borderColor: 'divider',
              pl: { xs: 0, md: 3 },
              pt: { xs: 0.5, md: 1 },
            }}
          >
            <Typography variant="subtitle2" fontWeight={800}>
              Color guide
            </Typography>
            <Stack spacing={1.25}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '6px',
                    bgcolor: (t) => alpha(t.palette.error.main, 0.16),
                    border: '1px solid',
                    borderColor: (t) => alpha(t.palette.error.main, 0.35),
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography variant="body2" fontWeight={750} color="text.primary">
                    Booked
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={550}>
                    Someone else already reserved this day
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '6px',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.18),
                    border: '2px solid',
                    borderColor: (t) => alpha(t.palette.primary.main, 0.45),
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography variant="body2" fontWeight={750} color="text.primary">
                    Your selection
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={550}>
                    Nights you&apos;ll have the vehicle
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
