import { TextField, type TextFieldProps } from '@mui/material'

import { formatPhilippineDriversLicenseInput } from '../../lib/philippineContact'

export type PhilippineDriversLicenseTextFieldProps = Omit<TextFieldProps, 'onChange' | 'type' | 'value'> & {
  value: string
  onChange: (licenseFormatted: string) => void
}

/** Uppercase LTO-style input; inserts hyphens for long all-digit suffixes (e.g. N12-34-567890). */
export default function PhilippineDriversLicenseTextField({
  value,
  onChange,
  InputProps,
  inputProps,
  ...props
}: PhilippineDriversLicenseTextFieldProps) {
  return (
    <TextField
      {...props}
      type="text"
      autoCapitalize="characters"
      autoComplete="off"
      spellCheck={false}
      value={value}
      onChange={(e) => {
        onChange(formatPhilippineDriversLicenseInput(e.target.value))
      }}
      placeholder="N12-34-567890"
      InputProps={InputProps}
      inputProps={{
        maxLength: 17,
        ...inputProps,
      }}
    />
  )
}
