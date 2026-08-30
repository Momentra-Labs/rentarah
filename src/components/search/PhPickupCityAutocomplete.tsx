import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import { Autocomplete, Box, InputAdornment, TextField, Typography } from '@mui/material'
import { createFilterOptions } from '@mui/material/Autocomplete'
import { useEffect, useState } from 'react'

import { PH_PICKUP_AREAS } from '@/data/phPickupAreas'

export const pickupAreaFilter = createFilterOptions<string>({
  matchFrom: 'any',
  limit: 48,
})

export function highlightPickupMatch(label: string, query: string) {
  const q = query.trim()
  if (!q) return label
  const idx = label.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return label
  return (
    <>
      {label.slice(0, idx)}
      <Box component="mark" sx={{ bgcolor: 'transparent', color: 'primary.main', fontWeight: 800, p: 0 }}>
        {label.slice(idx, idx + q.length)}
      </Box>
      {label.slice(idx + q.length)}
    </>
  )
}

type PhPickupCityAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  /** Fired after a list option (or free-solo commit) is chosen. */
  onSelect?: (value: string) => void
  id?: string
}

/** Type-to-filter PH city field — same options and highlight as the homepage planner. */
export default function PhPickupCityAutocomplete({
  value,
  onChange,
  onFocus,
  onSelect,
  id = 'browse-location',
}: PhPickupCityAutocompleteProps) {
  const [query, setQuery] = useState(value)

  useEffect(() => {
    setQuery(value)
  }, [value])

  return (
    <Autocomplete
      options={[...PH_PICKUP_AREAS]}
      value={value || null}
      inputValue={query}
      freeSolo
      filterOptions={pickupAreaFilter}
      openOnFocus
      autoHighlight
      autoComplete
      includeInputInList
      clearOnEscape
      handleHomeEndKeys
      selectOnFocus
      clearOnBlur={false}
      isOptionEqualToValue={(a, b) => a === b}
      noOptionsText={query.trim() ? `No city matches “${query.trim()}”` : 'Start typing a city'}
      ListboxProps={{ sx: { maxHeight: 280 } }}
      slotProps={{
        popper: { sx: { zIndex: 1600 } },
        paper: {
          elevation: 8,
          sx: {
            mt: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        },
      }}
      onInputChange={(_, next, reason) => {
        if (reason === 'reset') {
          setQuery(value)
          return
        }
        setQuery(next)
        if (reason === 'input' || reason === 'clear') onChange(next)
      }}
      onChange={(_, next) => {
        const chosen = (typeof next === 'string' ? next : next ?? '').trim()
        onChange(chosen)
        setQuery(chosen)
        if (chosen) onSelect?.(chosen)
      }}
      renderOption={(props, option) => {
        const nationwide = option === 'Philippines'
        return (
          <Box component="li" {...props} key={option}>
            <LocationOnOutlined
              sx={{
                fontSize: 18,
                mr: 1.25,
                color: nationwide ? 'primary.main' : 'text.secondary',
                flexShrink: 0,
              }}
              aria-hidden
            />
            <Typography component="span" sx={{ fontWeight: 650, fontSize: '0.9375rem', minWidth: 0 }}>
              {highlightPickupMatch(option, query)}
            </Typography>
            {nationwide && (
              <Typography
                component="span"
                sx={{
                  ml: 'auto',
                  pl: 1,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'primary.main',
                  letterSpacing: '0.02em',
                }}
              >
                All cities
              </Typography>
            )}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          id={id}
          margin="none"
          size="small"
          label="Pickup city"
          placeholder="Type to search — Cebu, Davao, Makati…"
          helperText={value.trim() ? `Searching around ${value.trim()}` : 'Philippines = all cities'}
          FormHelperTextProps={{ sx: { mx: 0, mt: 0.6, fontWeight: 600 } }}
          onFocus={onFocus}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <LocationOnOutlined
                    sx={{ fontSize: 20, color: value.trim() ? 'primary.main' : 'text.secondary' }}
                    aria-hidden
                  />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
          inputProps={{ ...params.inputProps, 'aria-label': 'Pickup city', autoComplete: 'off' }}
        />
      )}
    />
  )
}
