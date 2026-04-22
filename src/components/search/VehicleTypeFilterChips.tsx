import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import type { SearchFilters } from '../../types'
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_VALUES } from '../../utils/vehicleUtils'

const OPTIONS: { value: SearchFilters['vehicleType']; label: string }[] = [
  { value: 'all', label: 'All' },
  ...VEHICLE_TYPE_VALUES.map((v) => ({ value: v, label: VEHICLE_TYPE_LABELS[v] })),
]

export type VehicleTypeFilterChipsProps = {
  value: SearchFilters['vehicleType']
  onChange: (value: SearchFilters['vehicleType']) => void
}

/**
 * Primary vehicle category filter — works with {@link SearchFilters.vehicleType} and URL param <code>vt</code>.
 */
export default function VehicleTypeFilterChips({ value, onChange }: VehicleTypeFilterChipsProps) {
  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Vehicle type
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, v: SearchFilters['vehicleType'] | null) => v != null && onChange(v)}
        sx={{
          flexWrap: 'wrap',
          gap: 0.75,
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            borderRadius: 2,
            px: 1.5,
            fontWeight: 600,
            border: '1px solid',
            borderColor: 'divider',
            '&.Mui-selected': {
              fontWeight: 700,
            },
          },
        }}
      >
        {OPTIONS.map((o) => (
          <ToggleButton key={o.value} value={o.value} aria-pressed={value === o.value}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  )
}
