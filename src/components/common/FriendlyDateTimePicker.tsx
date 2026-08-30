import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import type { SxProps, Theme } from '@mui/material/styles'
import { useState } from 'react'
import type { Dayjs } from 'dayjs'

import { useT } from '@/hooks/useT'

import DateTimePickerDialog from './DateTimePickerDialog'

function mergeLabelProps(il: TextFieldProps['InputLabelProps']): TextFieldProps['InputLabelProps'] {
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

export type FriendlyDateTimePickerProps = {
  value: Dayjs | null
  onChange: (next: Dayjs | null) => void
  label: string
  minDate?: Dayjs | null
  disabled?: boolean
  showTime?: boolean
  size?: 'small' | 'medium'
  inputFormat?: string
  placeholder?: string
  helperText?: string
  onOpen?: () => void
  textFieldProps?: Omit<Partial<TextFieldProps>, 'sx'> & { sx?: SxProps<Theme> }
}

export default function FriendlyDateTimePicker({
  value,
  onChange,
  label,
  minDate,
  disabled = false,
  showTime = true,
  size = 'medium',
  inputFormat,
  placeholder,
  helperText,
  onOpen,
  textFieldProps,
}: FriendlyDateTimePickerProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const format = inputFormat ?? (showTime ? t('picker.dateTimeFormat') : t('picker.dateFormat'))
  const display = value?.isValid() ? value.format(format) : ''

  const openPicker = () => {
    if (disabled) return
    onOpen?.()
    setOpen(true)
  }

  const { InputLabelProps, InputProps, onFocus, onClick, sx, ...textFieldRest } = textFieldProps ?? {}

  return (
    <>
      <TextField
        margin="none"
        fullWidth
        {...textFieldRest}
        label={label}
        value={display}
        placeholder={placeholder}
        helperText={helperText}
        disabled={disabled}
        size={size}
        onClick={(e) => {
          onClick?.(e)
          openPicker()
        }}
        onFocus={(e) => {
          onFocus?.(e)
          onOpen?.()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        InputLabelProps={mergeLabelProps(InputLabelProps)}
        inputProps={{
          readOnly: true,
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          'aria-label': label,
        }}
        InputProps={{
          ...InputProps,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  openPicker()
                }}
                aria-label={t('picker.openPickerAria', { label })}
              >
                <CalendarMonthOutlined fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={sx as TextFieldProps['sx']}
      />
      <DateTimePickerDialog
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onAccept={onChange}
        minDate={minDate}
        title={label}
        showTime={showTime}
      />
    </>
  )
}
