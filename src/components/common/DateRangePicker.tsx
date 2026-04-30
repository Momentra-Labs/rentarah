import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import CalendarTodayRounded from '@mui/icons-material/CalendarTodayRounded'
import {
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { pickerFocusOutlineSx } from '../../styles/pickerFocus'
import {
  applyMinutesFromMidnightToDay,
  formatMinutesFromMidnightLabel,
  formatPickupReturnRentSpanHuman,
  formatTripDateTimeHuman,
  halfHourMinutesFromMidnightOptions,
  minutesFromMidnightSnappedHalfHour,
  snapToNearestHalfHourFromMidnight,
  withDefaultDropoffTime,
  withDefaultPickupTime,
} from '../../utils/dateUtils'

function mergeDateKeepTime(base: Dayjs | null, newDate: Dayjs | null): Dayjs | null {
  if (!newDate?.isValid()) return base
  if (!base?.isValid()) return newDate.second(0).millisecond(0)
  return newDate.hour(base.hour()).minute(base.minute()).second(0).millisecond(0)
}

function mergeTimeKeepDate(base: Dayjs | null, newTime: Dayjs | null): Dayjs | null {
  if (!newTime?.isValid()) return base
  if (!base?.isValid()) return newTime.second(0).millisecond(0)
  return base.hour(newTime.hour()).minute(newTime.minute()).second(0).millisecond(0)
}

function pickerInputWithLeadingIcon(params: TextFieldProps, icon: ReactNode): TextFieldProps {
  return {
    ...params,
    InputProps: {
      ...params.InputProps,
      startAdornment: (
        <>
          {icon}
          {params.InputProps?.startAdornment}
        </>
      ),
    },
  }
}

const labelProps600 = { sx: { fontWeight: 600 } } as const

export interface DateRangePickerProps {
  pickup: Dayjs | null
  dropoff: Dayjs | null
  onChange?: (range: { pickup: Dayjs | null; dropoff: Dayjs | null }) => void
  pickupLabel?: string
  dropoffLabel?: string
  minDate?: Dayjs | null
  spacing?: number
  size?: 'small' | 'medium'
  stacked?: boolean
  splitDateTime?: boolean
  /** md+ : one row — pick‑up | return (with compact pair groupings) */
  compactToolbar?: boolean
  mobileGroupedBoxes?: boolean
  autoReturnDayAfterPickup?: boolean
  timeGranularity?: 'native' | 'halfHourSelect'
  showPolicyCaption?: boolean
  slotProps?: {
    pickup?: Partial<TextFieldProps>
    dropoff?: Partial<TextFieldProps>
    textField?: Partial<TextFieldProps>
  }
  /** Show plain-language pickup / return lines under the fields (recommended for booking-style UIs). */
  showHumanReadableSummary?: boolean
}

const INPUT_RADIUS_SPLIT = '12px'

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
  splitDateTime = false,
  compactToolbar = false,
  mobileGroupedBoxes = true,
  autoReturnDayAfterPickup = false,
  timeGranularity = 'native',
  showPolicyCaption = true,
  showHumanReadableSummary = true,
}: DateRangePickerProps) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const now = dayjs()
  const halfHourOptions = useMemo(() => [...halfHourMinutesFromMidnightOptions()], [])

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
    if (!autoReturnDayAfterPickup && dropoff?.isValid()) {
      const pDay = adjusted.startOf('day')
      const dDay = dropoff.startOf('day')
      if (!dDay.isAfter(pDay, 'day')) {
        nextDropoff = withDefaultDropoffTime(pDay.add(1, 'day'))
      }
    }
    onChange?.({ pickup: adjusted, dropoff: nextDropoff })
  }

  const applyPickupDateWithSmartReturn = (merged: Dayjs) => {
    if (autoReturnDayAfterPickup) {
      onChange?.({
        pickup: merged,
        dropoff: withDefaultDropoffTime(merged.startOf('day').add(1, 'day')),
      })
      return
    }
    handlePickup(merged)
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

  const outlineRadius = splitDateTime ? INPUT_RADIUS_SPLIT : 2

  const fieldSxBase: SxProps<Theme> = {
    '& .MuiOutlinedInput-root': {
      borderRadius: outlineRadius,
    },
    '& .MuiOutlinedInput-input': {
      paddingRight: '2.5rem',
    },
    ...pickerFocusOutlineSx,
  }

  const pickupSxMerged = [fieldSxBase, tfCommonSx, pickupSx].filter(Boolean) as SxProps<Theme>
  const dropoffSxMerged = [fieldSxBase, tfCommonSx, dropoffSx].filter(Boolean) as SxProps<Theme>

  const selectFormSx = {
    ...fieldSxBase,
    '& .MuiOutlinedInput-notchedOutline': { borderRadius: outlineRadius },
  } as SxProps<Theme>

  const dateAdornment = (
    <InputAdornment position="start">
      <CalendarTodayRounded sx={{ fontSize: size === 'small' ? 17 : 18, opacity: 0.72 }} aria-hidden />
    </InputAdornment>
  )

  const timeAdornment = (
    <InputAdornment position="start">
      <AccessTimeRounded sx={{ fontSize: size === 'small' ? 17 : 18, opacity: 0.72 }} aria-hidden />
    </InputAdornment>
  )

  const handlePickupDate = (d: Dayjs | null) => {
    if (d == null) {
      handlePickup(null)
      return
    }
    if (!d.isValid()) return
    const merged = mergeDateKeepTime(pickup ?? null, d)
    if (!merged?.isValid()) return
    applyPickupDateWithSmartReturn(merged)
  }

  const handlePickupTime = (t: Dayjs | null) => {
    if (t == null || !pickup?.isValid()) return
    if (!t.isValid()) return
    const merged = mergeTimeKeepDate(pickup, t)
    if (merged?.isValid()) handlePickup(merged)
  }

  const handlePickupMinutes = (totalMins: number) => {
    if (!pickup?.isValid()) return
    const snapped = snapToNearestHalfHourFromMidnight(totalMins)
    const merged = applyMinutesFromMidnightToDay(pickup, snapped)
    if (merged?.isValid()) handlePickup(merged)
  }

  const handleDropoffDate = (d: Dayjs | null) => {
    if (!pickup?.isValid()) return
    if (d == null) {
      handleDropoff(null)
      return
    }
    if (!d.isValid()) return
    const merged = mergeDateKeepTime(dropoff ?? null, d)
    if (merged?.isValid()) handleDropoff(merged)
  }

  const handleDropoffTime = (t: Dayjs | null) => {
    if (!pickup?.isValid()) return
    if (t == null || !t.isValid()) return
    const baseDropoff =
      dropoff?.isValid()
        ? dropoff
        : withDefaultDropoffTime(pickup.startOf('day').add(1, 'day'))
    const merged = mergeTimeKeepDate(baseDropoff, t)
    if (merged?.isValid()) handleDropoff(merged)
  }

  const handleDropoffMinutes = (totalMins: number) => {
    if (!pickup?.isValid()) return
    const baseDropoff =
      dropoff?.isValid()
        ? dropoff
        : withDefaultDropoffTime(pickup.startOf('day').add(1, 'day'))
    const snapped = snapToNearestHalfHourFromMidnight(totalMins)
    const merged = mergeTimeKeepDate(baseDropoff, applyMinutesFromMidnightToDay(baseDropoff, snapped))
    if (merged?.isValid()) handleDropoff(merged)
  }

  const renderTimeControl = (
    role: 'pickup' | 'dropoff',
    base: Dayjs | null,
    disabled?: boolean,
  ) => {
    if (timeGranularity === 'halfHourSelect') {
      const minsVal = minutesFromMidnightSnappedHalfHour(
        base?.isValid()
          ? base
          : role === 'pickup'
            ? pickup?.isValid()
              ? pickup
              : withDefaultPickupTime(dayjs().add(1, 'day'))
            : pickup?.isValid()
              ? withDefaultDropoffTime(pickup.startOf('day').add(1, 'day'))
              : withDefaultPickupTime(dayjs().add(1, 'day')),
      )

      const onSel = role === 'pickup' ? handlePickupMinutes : handleDropoffMinutes

      return (
        <FormControl fullWidth size={size} disabled={disabled} sx={selectFormSx}>
          <InputLabel id={`rentara-time-${role}-label`} sx={{ fontWeight: 600 }}>
            Time
          </InputLabel>
          <Select<string>
            labelId={`rentara-time-${role}-label`}
            label="Time"
            value={String(minsVal)}
            onChange={(e) => onSel(Number(e.target.value))}
            MenuProps={{
              PaperProps: { sx: { maxHeight: 280 }, role: 'listbox' },
            }}
            aria-label={role === 'pickup' ? 'Pick-up time, 30-minute steps' : 'Return time, 30-minute steps'}
          >
            {halfHourOptions.map((m) => (
              <MenuItem key={m} value={String(m)}>
                {formatMinutesFromMidnightLabel(m)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )
    }

    return (
      <TimePicker
        label="Time"
        value={base}
        onChange={role === 'pickup' ? handlePickupTime : handleDropoffTime}
        ampm
        views={['hours', 'minutes']}
        inputFormat="hh:mm A"
        disabled={disabled}
        minutesStep={30}
        disableMaskedInput
        renderInput={(params) => (
          <TextField
            {...pickerInputWithLeadingIcon(params, timeAdornment)}
            {...tfCommonRest}
            {...(role === 'pickup' ? pickupRest : dropoffRest)}
            InputLabelProps={labelProps600}
            size={size}
            fullWidth
            disabled={disabled}
            sx={role === 'pickup' ? pickupSxMerged : dropoffSxMerged}
          />
        )}
      />
    )
  }

  const rowLabelSx = {
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontSize: '0.65rem',
    lineHeight: 1.2,
  } as const

  function PickupRow({ wrapBox }: { wrapBox?: boolean }) {
    const inner = (
      <Stack direction={{ xs: 'column', md: compactToolbar ? 'row' : 'row' }} spacing={1} sx={{ '& > .MuiBox-root, & > .MuiFormControl-root': { minWidth: 0 } }}>
        <Box sx={{ flex: { xs: 'none', md: compactToolbar ? '2 1 0%' : '2 1 0%' }, width: { xs: '100%', sm: 'auto' } }}>
          <DatePicker
            label="Date"
            value={pickup}
            onChange={handlePickupDate}
            minDate={minDate ?? undefined}
            inputFormat="MM/DD/YYYY"
            disableMaskedInput
            renderInput={(params) => (
              <TextField
                {...pickerInputWithLeadingIcon(params, dateAdornment)}
                {...tfCommonRest}
                {...pickupRest}
                InputLabelProps={labelProps600}
                size={size}
                fullWidth
                sx={pickupSxMerged}
              />
            )}
          />
        </Box>
        <Box sx={{ flex: { xs: 'none', md: compactToolbar ? '1 1 0%' : '1 1 0%' }, width: { xs: '100%', sm: 'auto' } }}>
          {renderTimeControl('pickup', pickup, false)}
        </Box>
      </Stack>
    )
    if (wrapBox) {
      return (
        <Box
          sx={{
            p: { xs: 1.5, sm: 1.25 },
            borderRadius: INPUT_RADIUS_SPLIT,
            bgcolor: (t) => alpha(t.palette.grey[300], t.palette.mode === 'light' ? 0.4 : 0.22),
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.9 : 0.6),
          }}
        >
          {inner}
        </Box>
      )
    }
    return inner
  }

  function ReturnRow({ wrapBox }: { wrapBox?: boolean }) {
    const dis = !pickup?.isValid()
    const inner = (
      <Stack direction={{ xs: 'column', md: compactToolbar ? 'row' : 'row' }} spacing={1}>
        <Box sx={{ flex: { xs: 'none', sm: '2 1 0%' }, width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
          <DatePicker
            label="Date"
            value={dropoff}
            onChange={handleDropoffDate}
            minDate={dropoffMin ?? minDate ?? undefined}
            disabled={dis}
            inputFormat="MM/DD/YYYY"
            disableMaskedInput
            renderInput={(params) => (
              <TextField
                {...pickerInputWithLeadingIcon(params, dateAdornment)}
                {...tfCommonRest}
                {...dropoffRest}
                InputLabelProps={labelProps600}
                size={size}
                fullWidth
                disabled={dis}
                sx={dropoffSxMerged}
              />
            )}
          />
        </Box>
        <Box sx={{ flex: { xs: 'none', sm: '1 1 0%' }, width: { xs: '100%', sm: 'auto' }, minWidth: 0 }}>
          {renderTimeControl('dropoff', dropoff, dis)}
        </Box>
      </Stack>
    )
    if (wrapBox) {
      return (
        <Box
          sx={{
            p: { xs: 1.5, sm: 1.25 },
            borderRadius: INPUT_RADIUS_SPLIT,
            bgcolor: (t) => alpha(t.palette.grey[300], t.palette.mode === 'light' ? 0.4 : 0.22),
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.9 : 0.6),
          }}
        >
          {inner}
        </Box>
      )
    }
    return inner
  }

  const connectorVertical = compactToolbar && isMdUp

  const spanSentence =
    pickup?.isValid() && dropoff?.isValid() ? formatPickupReturnRentSpanHuman(pickup, dropoff) : null

  const humanReadableSummary =
    showHumanReadableSummary && (pickup?.isValid() || dropoff?.isValid()) ? (
      <Stack
        component="aside"
        role="status"
        aria-live="polite"
        aria-label="Pick-up time, return time, and total rent duration"
        spacing={0.35}
        sx={{
          width: '100%',
          px: 1,
          py: 0.75,
          mt: compactToolbar && isMdUp ? 0.25 : 0,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'light' ? 0.04 : 0.08),
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.9 : 0.45),
        }}
      >
        {pickup?.isValid() ? (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', mr: 0.75 }}>
              Pick-up
            </Box>
            {formatTripDateTimeHuman(pickup)}
          </Typography>
        ) : null}
        {dropoff?.isValid() ? (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', mr: 0.75 }}>
              Return
            </Box>
            {formatTripDateTimeHuman(dropoff)}
          </Typography>
        ) : null}
        {spanSentence ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1.45,
              pt: 0.5,
              mt: 0.15,
              borderTop: '1px dashed',
              borderColor: alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.75 : 0.5),
            }}
          >
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', mr: 0.65 }}>
              Rent time
            </Box>
            {spanSentence}
          </Typography>
        ) : null}
      </Stack>
    ) : null

  const connector = (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignSelf: connectorVertical ? 'stretch' : 'auto',
        py: connectorVertical ? 2.5 : 0.125,
        px: connectorVertical ? 0.25 : 0,
      }}
      aria-hidden
    >
      <Box
        sx={
          connectorVertical
            ? {
                width: 1,
                flex: '0 0 1px',
                minHeight: 48,
                bgcolor: alpha(theme.palette.grey[500], 0.35),
                borderRadius: 1,
              }
            : {
                width: 1,
                height: { xs: 18, sm: 22 },
                bgcolor: alpha(theme.palette.grey[400], theme.palette.mode === 'light' ? 0.45 : 0.35),
                borderRadius: 1,
              }
        }
      />
    </Box>
  )

  if (splitDateTime) {
    const useHorizontal = Boolean(compactToolbar && isMdUp)
    const mobWrap = Boolean(mobileGroupedBoxes && !isMdUp)

    if (useHorizontal) {
      return (
        <Stack spacing={1.25} sx={{ width: '100%', minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="flex-end"
            sx={{ width: '100%', flexWrap: { md: 'nowrap' }, minWidth: 0 }}
          >
            <Stack spacing={0.35} sx={{ flex: '1 1 0%', minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={rowLabelSx}>
                {pickupLabel}
              </Typography>
              <PickupRow />
            </Stack>
            {connector}
            <Stack spacing={0.35} sx={{ flex: '1 1 0%', minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={rowLabelSx}>
                {dropoffLabel}
              </Typography>
              <ReturnRow />
            </Stack>
          </Stack>
          {humanReadableSummary}
        </Stack>
      )
    }

    return (
      <Stack spacing={spacing} sx={{ width: '100%' }}>
        <Stack spacing={0.65}>
          <Typography variant="caption" color="text.secondary" sx={rowLabelSx}>
            {pickupLabel}
          </Typography>
          <PickupRow wrapBox={mobWrap} />
        </Stack>

        {connector}

        <Stack spacing={0.65} sx={{ opacity: pickup?.isValid() ? 1 : 0.52 }}>
          <Typography variant="caption" color="text.secondary" sx={rowLabelSx}>
            {dropoffLabel}
          </Typography>
          <ReturnRow wrapBox={mobWrap} />
        </Stack>

        {humanReadableSummary}

        {showPolicyCaption ? (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
            Pick-up and return include time for meetups. Trip length is still priced by calendar day.
          </Typography>
        ) : null}
      </Stack>
    )
  }

  const policyCaption = (
    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
      Pick-up and return include time for meetups. Trip length is still priced by calendar day.
    </Typography>
  )

  return (
    <Stack spacing={spacing} sx={{ width: '100%' }}>
      <Stack
        spacing={spacing}
        direction={stacked ? 'column' : { xs: 'column', sm: 'row' }}
        sx={{
          '& .MuiFormControl-root': stacked
            ? { flex: 1, width: '100%' }
            : { flex: 1, minWidth: { xs: 0, sm: 200 } },
          '& .MuiInputLabel-root': { fontWeight: 600 },
          ...pickerFocusOutlineSx,
        }}
      >
        <DateTimePicker
          ampm
          views={['year', 'month', 'day', 'hours', 'minutes']}
          minutesStep={30}
          inputFormat="MM/DD/YYYY hh:mm A"
          label={pickupLabel}
          value={pickup}
          onChange={handlePickup}
          minDate={minDate ?? undefined}
          renderInput={(params) => (
            <TextField
              {...params}
              {...tfCommonRest}
              {...pickupRest}
              InputLabelProps={{
                ...(params.InputLabelProps ?? {}),
                sx: { fontWeight: 600, ...(params.InputLabelProps as { sx?: object } | undefined)?.sx },
              }}
              size={size}
              fullWidth
              sx={pickupSxMerged}
            />
          )}
        />
        <DateTimePicker
          ampm
          views={['year', 'month', 'day', 'hours', 'minutes']}
          minutesStep={30}
          inputFormat="MM/DD/YYYY hh:mm A"
          label={dropoffLabel}
          value={dropoff}
          onChange={handleDropoff}
          minDate={dropoffMin ?? minDate ?? undefined}
          renderInput={(params) => (
            <TextField
              {...params}
              {...tfCommonRest}
              {...dropoffRest}
              InputLabelProps={{
                ...(params.InputLabelProps ?? {}),
                sx: { fontWeight: 600, ...(params.InputLabelProps as { sx?: object } | undefined)?.sx },
              }}
              size={size}
              fullWidth
              sx={dropoffSxMerged}
            />
          )}
        />
      </Stack>
      {humanReadableSummary}
      {showPolicyCaption ? policyCaption : null}
    </Stack>
  )
}
