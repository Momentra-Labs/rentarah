import { InputAdornment, TextField, type TextFieldProps } from '@mui/material'

import { parsePhilippineMobileInputToNationalDigits } from '../../lib/philippineContact'

export type PhilippineNationalMobileTextFieldProps = Omit<TextFieldProps, 'onChange' | 'type' | 'value'> & {
  value: string
  onChange: (nationalDigits: string) => void
}

/** Visible +63 (fixed) plus 10-digit national mobile. Paste of 0917… or 639… is normalized to digits only. */
export default function PhilippineNationalMobileTextField({
  value,
  onChange,
  InputProps,
  inputProps,
  ...props
}: PhilippineNationalMobileTextFieldProps) {
  return (
    <TextField
      {...props}
      type="tel"
      autoComplete="tel-national"
      value={value}
      onChange={(e) => {
        onChange(parsePhilippineMobileInputToNationalDigits(e.target.value))
      }}
      placeholder="9171234567"
      InputProps={{
        ...InputProps,
        startAdornment: (
          <InputAdornment position="start" sx={{ color: 'text.secondary', fontWeight: 700, mr: 0.5 }}>
            +63
          </InputAdornment>
        ),
      }}
      inputProps={{
        maxLength: 10,
        inputMode: 'numeric',
        ...inputProps,
      }}
    />
  )
}
