import { Box, Chip, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import type { SearchFilters } from '../../types'

type Preset = {
  /** Short chip label */
  label: string
  /** Narrow filter patch — merges into current constraints */
  patch: Partial<SearchFilters>
  ariaLabel?: string
}

const PRESETS: Preset[] = [
  {
    label: '~₱2.5k / day',
    patch: { priceRange: [0, 2500] },
    ariaLabel: 'Cap price at roughly 2500 pesos per day',
  },
  {
    label: '~₱5k / day',
    patch: { priceRange: [0, 5000] },
    ariaLabel: 'Cap price at roughly 5000 pesos per day',
  },
  {
    label: 'Automatic',
    patch: { transmission: 'Automatic' },
  },
  {
    label: '5+ seats',
    patch: { seats: 5 },
  },
  {
    label: '7+ seats',
    patch: { seats: 7 },
  },
  {
    label: 'Motorcycles',
    patch: { vehicleType: 'motorcycle', types: [] },
    ariaLabel: 'Show motorcycles only',
  },
  {
    label: 'EV',
    patch: { fuel: 'Electric' },
  },
  {
    label: 'Hybrid',
    patch: { fuel: 'Hybrid' },
  },
  {
    label: 'SUV body',
    patch: { types: ['SUV'] },
    ariaLabel: 'Vehicle segment: SUV only',
  },
]

export default function SearchFilterPresets({
  onApply,
}: {
  onApply: (partial: Partial<SearchFilters>) => void
}) {
  const theme = useTheme()

  return (
    <Box>
      <Typography
        variant="caption"
        component="span"
        color="text.secondary"
        sx={{ fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block' }}
      >
        Quick picks
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.75 }}>
        {PRESETS.map((p) => (
          <Chip
            key={p.label}
            label={p.label}
            size="small"
            variant="outlined"
            clickable
            onClick={() => onApply(p.patch)}
            aria-label={p.ariaLabel ?? `Apply quick filter: ${p.label}`}
            sx={{
              fontWeight: 600,
              letterSpacing: '0.02em',
              borderColor: 'divider',
              transition: theme.transitions.create(['background-color', 'border-color', 'transform'], {
                duration: theme.transitions.duration.short,
              }),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.14),
                borderColor: alpha(theme.palette.primary.main, 0.45),
              },
              '&:active': {
                transform: 'scale(0.97)',
              },
            }}
          />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block', lineHeight: 1.45 }}>
        Stacks with your refinements below — tweak or tap Clear anytime.
      </Typography>
    </Box>
  )
}
