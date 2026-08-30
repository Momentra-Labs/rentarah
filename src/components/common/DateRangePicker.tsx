import {
  Box,
  FormControl,
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

// Shared helper kept next to the picker for import convenience.
// eslint-disable-next-line react-refresh/only-export-components -- utility export beside component
export function mergePickerInputLabelProps(il: TextFieldProps['InputLabelProps']): TextFieldProps['InputLabelProps'] {
  const p = il ?? {}
  const sxIn =
    typeof p === 'object' && p && 'sx' in p ? (p as { sx?: object | readonly object[] }).sx : undefined
  const flatSx =
    sxIn != null ? (Array.isArray(sxIn) ? Object.assign({}, ...sxIn.filter((x) => x != null && typeof x === 'object')) : sxIn) : {}
  return {
    ...(typeof p === 'object' ? p : {}),
    sx: { fontWeight: 600, ...(typeof flatSx === 'object' && flatSx ? flatSx : {}) },
  }
}

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
  /** Narrower paddings inside the pickup/return recap (e.g. landing trip planner). */
  denseSummary?: boolean
  /**
   * Touch devices default to MUI Mobile* pickers (full-screen dialog, no trailing field icon).
   * Set true to keep desktop pickers so the calendar/clock affordance stays visible in the input.
   */
  preferDesktopPickers?: boolean
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
  denseSummary = false,
  preferDesktopPickers = false,
}: DateRangePickerProps) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const desktopPickerProps = preferDesktopPickers ? { desktopModeMediaQuery: '@media (min-width: 0px)' } : {}

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
    minWidth: 0,
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: outlineRadius,
      overflow: 'hidden',
      minWidth: 0,
    },
    '& .MuiOutlinedInput-input': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: size === 'small' ? '0.8125rem' : '0.875rem',
      fontWeight: 650,
      letterSpacing: '-0.01em',
      // Keep room for the calendar/clock adornment without eating the value.
      paddingRight: '0.5rem',
    },
    '& .MuiInputAdornment-positionEnd': {
      flexShrink: 0,
      ml: 0,
      '& .MuiIconButton-root': {
        p: size === 'small' ? 0.5 : 0.75,
      },
    },
    '& .MuiSelect-select': {
      fontSize: size === 'small' ? '0.8125rem' : '0.875rem',
      fontWeight: 650,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    ...pickerFocusOutlineSx,
  }

  /** Consumer `sx` first; core chrome last so outline radius/padding survive theme overrides */
  const pickupSxMerged = [tfCommonSx, pickupSx, fieldSxBase].filter(Boolean) as SxProps<Theme>
  const dropoffSxMerged = [tfCommonSx, dropoffSx, fieldSxBase].filter(Boolean) as SxProps<Theme>

  const selectFormSx = {
    ...fieldSxBase,
    '& .MuiOutlinedInput-notchedOutline': { borderRadius: outlineRadius },
  } as SxProps<Theme>

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

  /** Compact readable formats — long weekday strings clip in narrow book panels. */
  const dateInputFormat = 'MMM D, YYYY'
  const dateTimeInputFormat = 'MMM D, YYYY · h:mm A'
  const timeInputFormat = 'h:mm A'

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
          <InputLabel id={`rentara-time-${role}-label`} sx={{ fontWeight: 700 }}>
            {role === 'pickup' ? 'Pick-up time' : 'Return time'}
          </InputLabel>
          <Select<string>
            labelId={`rentara-time-${role}-label`}
            label={role === 'pickup' ? 'Pick-up time' : 'Return time'}
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
        {...desktopPickerProps}
        label={role === 'pickup' ? 'Pick-up time' : 'Return time'}
        value={base}
        onChange={role === 'pickup' ? handlePickupTime : handleDropoffTime}
        ampm
        views={['hours', 'minutes']}
        inputFormat={timeInputFormat}
        disabled={disabled}
        minutesStep={30}
        disableMaskedInput
        renderInput={(params) => (
          <TextField
            {...params}
            margin="none"
            {...tfCommonRest}
            {...(role === 'pickup' ? pickupRest : dropoffRest)}
            InputLabelProps={mergePickerInputLabelProps(params.InputLabelProps)}
            size={size}
            fullWidth
            disabled={disabled}
            helperText={role === 'pickup' ? 'Meet the host' : 'Hand the keys back'}
            FormHelperTextProps={{ sx: { mx: 0.5, mt: 0.5, fontWeight: 600 } }}
            sx={role === 'pickup' ? pickupSxMerged : dropoffSxMerged}
          />
        )}
      />
    )
  }

  const rowLabelSx = {
    fontWeight: 800,
    letterSpacing: '-0.01em',
    textTransform: 'none',
    fontSize: '0.8125rem',
    lineHeight: 1.3,
    color: 'text.primary',
  } as const

  /** Side-by-side only in wide compact toolbars; otherwise stack so values stay fully visible. */
  const splitFieldsDirection = compactToolbar && isMdUp ? 'row' : 'column'

  function PickupRow({ wrapBox }: { wrapBox?: boolean }) {
    const inner = (
      <Stack
        direction={splitFieldsDirection}
        spacing={1}
        sx={{ width: '100%', minWidth: 0, '& > .MuiBox-root, & > .MuiFormControl-root': { minWidth: 0, width: '100%' } }}
      >
        <Box sx={{ flex: splitFieldsDirection === 'row' ? '1.6 1 0%' : 'none', width: '100%', minWidth: 0 }}>
          <DatePicker
            {...desktopPickerProps}
            label="Date"
            value={pickup}
            onChange={handlePickupDate}
            minDate={minDate ?? undefined}
            inputFormat={dateInputFormat}
            disableMaskedInput
            renderInput={(params) => (
              <TextField
                {...params}
                margin="none"
                {...tfCommonRest}
                {...pickupRest}
                InputLabelProps={mergePickerInputLabelProps(params.InputLabelProps)}
                size={size}
                fullWidth
                placeholder="e.g. Apr 28, 2026"
                sx={pickupSxMerged}
              />
            )}
          />
        </Box>
        <Box sx={{ flex: splitFieldsDirection === 'row' ? '1 1 0%' : 'none', width: '100%', minWidth: 0 }}>
          {renderTimeControl('pickup', pickup, false)}
        </Box>
      </Stack>
    )
    if (wrapBox) {
      return (
        <Box
          sx={{
            p: { xs: 1.5, sm: 1.5 },
            borderRadius: INPUT_RADIUS_SPLIT,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
            border: '1px solid',
            borderColor: (t) => alpha(t.palette.primary.main, 0.12),
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
      <Stack
        direction={splitFieldsDirection}
        spacing={1}
        sx={{ width: '100%', minWidth: 0, '& > .MuiBox-root, & > .MuiFormControl-root': { minWidth: 0, width: '100%' } }}
      >
        <Box sx={{ flex: splitFieldsDirection === 'row' ? '1.6 1 0%' : 'none', width: '100%', minWidth: 0 }}>
          <DatePicker
            {...desktopPickerProps}
            label="Date"
            value={dropoff}
            onChange={handleDropoffDate}
            minDate={dropoffMin ?? minDate ?? undefined}
            disabled={dis}
            inputFormat={dateInputFormat}
            disableMaskedInput
            renderInput={(params) => (
              <TextField
                {...params}
                margin="none"
                {...tfCommonRest}
                {...dropoffRest}
                InputLabelProps={mergePickerInputLabelProps(params.InputLabelProps)}
                size={size}
                fullWidth
                disabled={dis}
                placeholder="e.g. May 1, 2026"
                sx={dropoffSxMerged}
              />
            )}
          />
        </Box>
        <Box sx={{ flex: splitFieldsDirection === 'row' ? '1 1 0%' : 'none', width: '100%', minWidth: 0 }}>
          {renderTimeControl('dropoff', dropoff, dis)}
        </Box>
      </Stack>
    )
    if (wrapBox) {
      return (
        <Box
          sx={{
            p: { xs: 1.5, sm: 1.5 },
            borderRadius: INPUT_RADIUS_SPLIT,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
            border: '1px solid',
            borderColor: (t) => alpha(t.palette.primary.main, 0.12),
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
        spacing={0.75}
        sx={{
          width: '100%',
          px: denseSummary ? 1 : 1.5,
          py: denseSummary ? 1 : 1.35,
          mt: compactToolbar && isMdUp ? 0.5 : 0.25,
          borderRadius: 2,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
          border: '1px solid',
          borderColor: (t) => alpha(t.palette.primary.main, 0.14),
        }}
      >
        {pickup?.isValid() ? (
          <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
            <Box component="span" sx={{ fontWeight: 800, color: 'primary.main', mr: 0.75 }}>
              Pick-up
            </Box>
            <Box component="span" sx={{ fontWeight: 650, color: 'text.primary' }}>
              {formatTripDateTimeHuman(pickup)}
            </Box>
          </Typography>
        ) : null}
        {dropoff?.isValid() ? (
          <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
            <Box component="span" sx={{ fontWeight: 800, color: 'primary.main', mr: 0.75 }}>
              Return
            </Box>
            <Box component="span" sx={{ fontWeight: 650, color: 'text.primary' }}>
              {formatTripDateTimeHuman(dropoff)}
            </Box>
          </Typography>
        ) : null}
        {spanSentence ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.45,
              pt: 0.75,
              borderTop: '1px dashed',
              borderColor: (t) => alpha(t.palette.primary.main, 0.2),
              fontWeight: 600,
            }}
          >
            <Box component="span" sx={{ fontWeight: 800, color: 'text.primary', mr: 0.75 }}>
              Trip length
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
                height: denseSummary ? { xs: 12, sm: 16 } : { xs: 18, sm: 22 },
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
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block', fontWeight: 500 }}>
            Times are for meeting the host. Pricing still counts calendar days between pick-up and return.
          </Typography>
        ) : null}
      </Stack>
    )
  }

  const policyCaption = (
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block', fontWeight: 500 }}>
      Times are for meeting the host. Pricing still counts calendar days between pick-up and return.
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
          '& .MuiInputLabel-root': { fontWeight: 700 },
          ...pickerFocusOutlineSx,
        }}
      >
        <DateTimePicker
          {...desktopPickerProps}
          ampm
          views={['year', 'month', 'day', 'hours', 'minutes']}
          minutesStep={30}
          inputFormat={dateTimeInputFormat}
          label={pickupLabel}
          value={pickup}
          onChange={handlePickup}
          minDate={minDate ?? undefined}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="none"
              {...tfCommonRest}
              {...pickupRest}
              InputLabelProps={mergePickerInputLabelProps(params.InputLabelProps)}
              size={size}
              fullWidth
              placeholder="Apr 28, 2026 · 10:00 AM"
              sx={pickupSxMerged}
            />
          )}
        />
        <DateTimePicker
          {...desktopPickerProps}
          ampm
          views={['year', 'month', 'day', 'hours', 'minutes']}
          minutesStep={30}
          inputFormat={dateTimeInputFormat}
          label={dropoffLabel}
          value={dropoff}
          onChange={handleDropoff}
          minDate={dropoffMin ?? minDate ?? undefined}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="none"
              {...tfCommonRest}
              {...dropoffRest}
              InputLabelProps={mergePickerInputLabelProps(params.InputLabelProps)}
              size={size}
              fullWidth
              placeholder="May 1, 2026 · 10:00 AM"
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
