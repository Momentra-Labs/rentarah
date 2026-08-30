import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { CalendarPicker } from '@mui/x-date-pickers/CalendarPicker'
import { PickersDay } from '@mui/x-date-pickers/PickersDay'
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState, type Key, type ReactNode } from 'react'

import { useT } from '@/hooks/useT'
import { applyMinutesFromMidnightToDay } from '@/utils/dateUtils'

import {
  applyDateKeepTime,
  createPickerDraft,
  earliestAllowedInstant,
  hour12From24,
  isDayBeforeMin,
  MINUTE_STEPS,
  minuteToFiveStep,
  nextWeekDay,
  toHour24,
  weekendStart,
} from './dateTimePickerDraft'

const DAY_SIZE = 36
const WEEK_ROW = 40
const WEEK_ROWS = 6
const CALENDAR_WEEKS_HEIGHT = WEEK_ROW * WEEK_ROWS
const DIALOG_GUTTER = { xs: 2.5, sm: 3 }

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

function TimeColumn({
  label,
  listLabel,
  children,
}: {
  label: string
  listLabel: string
  children: ReactNode
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ fontWeight: 700, letterSpacing: '0.08em', mb: 0.75, px: 0.25 }}
      >
        {label}
      </Typography>
      <Box
        role="listbox"
        aria-label={listLabel}
        sx={{
          flex: 1,
          maxHeight: 260,
          overflowY: 'auto',
          borderRadius: 2,
          border: '1px solid',
          borderColor: (th) => alpha(th.palette.divider, 0.95),
          bgcolor: (th) => (th.palette.mode === 'dark' ? alpha(th.palette.common.white, 0.04) : alpha(th.palette.grey[500], 0.05)),
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

function TimeOption({
  selected,
  disabled,
  text,
  ariaLabel,
  mark,
  onClick,
}: {
  selected: boolean
  disabled: boolean
  text: string
  ariaLabel: string
  mark?: 'hour' | 'minute'
  onClick: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={ariaLabel}
      disabled={disabled}
      data-time-selected={selected ? mark : undefined}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 44,
        px: 1.5,
        border: 'none',
        borderLeft: '3px solid',
        borderLeftColor: selected ? 'primary.main' : 'transparent',
        bgcolor: (th) => (selected ? alpha(th.palette.primary.main, 0.08) : 'transparent'),
        color: disabled ? 'text.disabled' : selected ? 'primary.main' : 'text.primary',
        fontWeight: selected ? 700 : 500,
        fontSize: '1rem',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.42 : 1,
        '&:hover': disabled
          ? undefined
          : { bgcolor: (th) => alpha(th.palette.primary.main, selected ? 0.1 : 0.04) },
      }}
    >
      {text}
    </Box>
  )
}

const weekGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  width: '100%',
  maxWidth: '100%',
  justifyItems: 'center',
  alignItems: 'center',
  boxSizing: 'border-box' as const,
  margin: 0,
  padding: 0,
}

export type DateTimePickerDialogProps = {
  open: boolean
  onClose: () => void
  value: Dayjs | null
  onAccept: (next: Dayjs) => void
  minDate?: Dayjs | null
  title: string
  showTime?: boolean
}

export default function DateTimePickerDialog({
  open,
  onClose,
  value,
  onAccept,
  minDate,
  title,
  showTime = true,
}: DateTimePickerDialogProps) {
  const t = useT()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [draft, setDraft] = useState(() => createPickerDraft(value, minDate, showTime))
  const [step, setStep] = useState<'date' | 'time'>('date')

  useEffect(() => {
    if (open) {
      setDraft(createPickerDraft(value, minDate, showTime))
      setStep('date')
    }
  }, [open, value, minDate, showTime])

  useEffect(() => {
    if (!open || step !== 'time') return
    const id = window.requestAnimationFrame(() => {
      const hourEl = document.querySelector('[data-time-selected="hour"]') as HTMLElement | null
      const minuteEl = document.querySelector('[data-time-selected="minute"]') as HTMLElement | null
      hourEl?.scrollIntoView?.({ block: 'center', inline: 'nearest' })
      minuteEl?.scrollIntoView?.({ block: 'center', inline: 'nearest' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [open, step])

  const earliest = useMemo(() => earliestAllowedInstant(minDate), [minDate])
  const tooSoon = showTime ? draft.isBefore(earliest) : draft.isBefore(earliest, 'day')
  const dateReady = draft.isValid() && !isDayBeforeMin(draft, minDate)
  const onDateStep = !showTime || step === 'date'

  const setDay = (day: Dayjs | null) => {
    if (!day?.isValid() || isDayBeforeMin(day, minDate)) return
    setDraft((prev) => applyDateKeepTime(prev, day, showTime, minDate))
  }

  const setMinutes = (totalMins: number) => {
    const next = applyMinutesFromMidnightToDay(draft, totalMins)
    if (next.isBefore(earliest)) return
    setDraft(next)
  }

  const hour12 = hour12From24(draft.hour())
  const isPm = draft.hour() >= 12
  const minute = minuteToFiveStep(draft.minute())

  const setClock = (nextHour12: number, nextPm: boolean, nextMinute: number) => {
    setMinutes(toHour24(nextHour12, nextPm) * 60 + nextMinute)
  }

  const todayDay = dayjs().startOf('day')
  const tomorrowDay = todayDay.add(1, 'day')
  const weekendDay = weekendStart()
  const nextWeek = nextWeekDay()

  const shortcutItems = [
    { id: 'today', label: t('picker.today'), day: todayDay },
    { id: 'tomorrow', label: t('picker.tomorrow'), day: tomorrowDay },
    { id: 'weekend', label: t('picker.thisWeekend'), day: weekendDay },
    { id: 'nextWeek', label: t('picker.nextWeek'), day: nextWeek },
  ].filter((item) => !isDayBeforeMin(item.day, minDate))

  const handleConfirm = () => {
    if (tooSoon) return
    onAccept(showTime ? draft.second(0).millisecond(0) : draft.startOf('day'))
    onClose()
  }

  const renderDay = (day: Dayjs, _selected: Dayjs[], pickersDayProps: PickersDayProps<Dayjs>) => {
    const iso = day.format('YYYY-MM-DD')
    const { key, ...rest } = pickersDayProps as PickersDayProps<Dayjs> & { key?: Key }
    if (pickersDayProps.outsideCurrentMonth && !pickersDayProps.showDaysOutsideCurrentMonth) {
      return <Box key={key ?? iso} aria-hidden sx={{ width: DAY_SIZE, height: DAY_SIZE }} />
    }
    return (
      <PickersDay
        key={key ?? iso}
        {...rest}
        day={day}
        selected={draft.isSame(day, 'day')}
        sx={{
          width: DAY_SIZE,
          height: DAY_SIZE,
          fontWeight: 700,
          fontSize: '0.875rem',
        }}
      />
    )
  }

  const calendarSx = {
    width: '100%',
    maxWidth: '100%',
    mx: 0,
    overflow: 'visible',
    '& .MuiCalendarPicker-root': {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      m: 0,
      p: 0,
      height: 'auto',
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
      marginBottom: 1.5,
      maxHeight: 36,
      minHeight: 36,
      width: '100%',
    },
    '& .MuiPickersCalendarHeader-labelContainer': { marginRight: 'auto' },
    '& .MuiPickersCalendarHeader-label': { fontWeight: 800, letterSpacing: '-0.02em' },
    '& .MuiDayPicker-header': {
      ...weekGridSx,
      display: 'grid',
      mb: 0.75,
      justifyContent: 'center',
    },
    '& .MuiDayPicker-weekDayLabel': {
      width: DAY_SIZE,
      height: 28,
      margin: 0,
      padding: 0,
      fontWeight: 800,
      fontSize: '0.75rem',
      lineHeight: '28px',
      color: 'text.secondary',
      justifySelf: 'center',
    },
    '& .PrivatePickersSlideTransition-root, & .MuiDayPicker-slideTransition': {
      minHeight: CALENDAR_WEEKS_HEIGHT,
      height: `${CALENDAR_WEEKS_HEIGHT}px !important`,
      overflowX: 'hidden',
      overflowY: 'visible',
    },
    '& .MuiDayPicker-monthContainer': {
      overflow: 'visible',
      position: 'relative',
      width: '100%',
    },
    '& .MuiDayPicker-weekContainer': {
      ...weekGridSx,
      minHeight: WEEK_ROW,
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
      margin: 0,
      justifySelf: 'center',
    },
  } as const

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="rentara-dt-picker-title"
      PaperProps={{
        'data-testid': 'date-time-picker-dialog',
        sx: {
          m: { xs: 0, sm: 2 },
          width: { xs: '100%', sm: 440 },
          maxHeight: { xs: '96dvh', sm: '92vh' },
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          borderRadius: { xs: '24px 24px 0 0', sm: 3 },
          position: { xs: 'fixed', sm: 'relative' },
          bottom: { xs: 0, sm: 'auto' },
        },
      }}
      sx={{
        zIndex: 1500,
        '& .MuiDialog-container': {
          alignItems: { xs: 'flex-end', sm: 'center' },
        },
      }}
    >
      <DialogContent
        sx={{
          px: DIALOG_GUTTER,
          pt: { xs: 1.25, sm: 2.5 },
          pb: 2.5,
          overflow: onDateStep ? 'visible' : 'auto',
          flex: '1 1 auto',
        }}
      >
        {isMobile ? (
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 4,
              borderRadius: 999,
              bgcolor: 'grey.200',
              mx: 'auto',
              mb: 2,
            }}
          />
        ) : null}

        <Stack spacing={0.75} sx={{ width: '100%' }}>
          <Typography id="rentara-dt-picker-title" variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            {title}
          </Typography>
          {showTime ? (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              {onDateStep ? t('picker.stepDate') : t('picker.stepTime')}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 650 }}>
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.75 }}>
              {t('picker.selected')}
            </Box>
            {showTime && !onDateStep
              ? draft.format('ddd, MMM D · h:mm A')
              : draft.format('ddd, MMM D, YYYY')}
          </Typography>
        </Stack>

        {onDateStep ? (
          <Stack spacing={2} sx={{ width: '100%', mt: 2 }}>
            {shortcutItems.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                {shortcutItems.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.label}
                    size="small"
                    clickable
                    color={draft.isSame(item.day, 'day') ? 'primary' : 'default'}
                    variant="outlined"
                    onClick={() => setDay(item.day)}
                    sx={{
                      fontWeight: 700,
                      bgcolor: draft.isSame(item.day, 'day')
                        ? (th) => alpha(th.palette.primary.main, 0.08)
                        : 'transparent',
                    }}
                  />
                ))}
              </Stack>
            ) : null}

            <Box sx={calendarSx}>
              <CalendarPicker
                date={draft}
                onChange={setDay}
                minDate={minDate ?? undefined}
                openTo="day"
                views={['month', 'day']}
                renderDay={renderDay}
              />
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 2.5 }}>
            <Stack alignItems="center" spacing={1.25}>
              <Typography
                aria-hidden
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', sm: '2.75rem' },
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'text.primary',
                }}
              >
                {hour12}:{String(minute).padStart(2, '0')}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={isPm ? 'pm' : 'am'}
                onChange={(_e, next) => {
                  if (next === 'am' || next === 'pm') setClock(hour12, next === 'pm', minute)
                }}
                aria-label={t('picker.time')}
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 2,
                    py: 0.5,
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    borderColor: (th) => alpha(th.palette.divider, 0.95),
                    '&.Mui-selected': {
                      bgcolor: (th) => alpha(th.palette.primary.main, 0.1),
                      color: 'primary.main',
                      borderColor: (th) => alpha(th.palette.primary.main, 0.35),
                    },
                  },
                }}
              >
                <ToggleButton value="am">{t('picker.am')}</ToggleButton>
                <ToggleButton value="pm">{t('picker.pm')}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="stretch">
              <TimeColumn label={t('picker.hour')} listLabel={t('picker.hour')}>
                {HOURS_12.map((h) => {
                  const candidate = applyMinutesFromMidnightToDay(draft, toHour24(h, isPm) * 60 + minute)
                  return (
                    <TimeOption
                      key={h}
                      mark="hour"
                      text={String(h)}
                      ariaLabel={`${t('picker.hour')} ${h}`}
                      selected={hour12 === h}
                      disabled={candidate.isBefore(earliest)}
                      onClick={() => setClock(h, isPm, minute)}
                    />
                  )
                })}
              </TimeColumn>
              <TimeColumn label={t('picker.minute')} listLabel={t('picker.minute')}>
                {MINUTE_STEPS.map((m) => {
                  const candidate = applyMinutesFromMidnightToDay(draft, toHour24(hour12, isPm) * 60 + m)
                  const text = String(m).padStart(2, '0')
                  return (
                    <TimeOption
                      key={m}
                      mark="minute"
                      text={text}
                      ariaLabel={`${t('picker.minute')} ${text}`}
                      selected={minute === m}
                      disabled={candidate.isBefore(earliest)}
                      onClick={() => setClock(hour12, isPm, m)}
                    />
                  )
                })}
              </TimeColumn>
            </Stack>

            {tooSoon ? (
              <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                {t('picker.pickLaterTime')}
              </Typography>
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: DIALOG_GUTTER,
          pt: 2,
          pb: { xs: 2, sm: 2.5 },
          gap: 1,
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>
          {t('common.cancel')}
        </Button>
        {showTime && !onDateStep ? (
          <Button onClick={() => setStep('date')} sx={{ fontWeight: 700 }}>
            {t('picker.back')}
          </Button>
        ) : null}
        {showTime && onDateStep ? (
          <Button
            variant="contained"
            onClick={() => setStep('time')}
            disabled={!dateReady}
            sx={{ fontWeight: 800, px: 2.5 }}
          >
            {t('picker.next')}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleConfirm} disabled={tooSoon} sx={{ fontWeight: 800, px: 2.5 }}>
            {t('picker.confirm')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
