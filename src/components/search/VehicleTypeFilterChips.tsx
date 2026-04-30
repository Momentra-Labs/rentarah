import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import type { SearchFilters } from '../../types'
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_VALUES } from '../../utils/vehicleUtils'
import { compactSearchToggleSx } from './filterPanelStyles'

const OPTIONS: { value: SearchFilters['vehicleType']; label: string }[] = [
  { value: 'all', label: 'All' },
  ...VEHICLE_TYPE_VALUES.map((v) => ({ value: v, label: VEHICLE_TYPE_LABELS[v] })),
]

export type VehicleTypeFilterChipsProps = {
  value: SearchFilters['vehicleType']
  onChange: (value: SearchFilters['vehicleType']) => void
}

/**
 * Inline vehicle-category control — visuals match compact {@link FilterPanel} toggles so chip row + drawer feel like one system.
 */
export default function VehicleTypeFilterChips({ value, onChange }: VehicleTypeFilterChipsProps) {
  const theme = useTheme()
  return (
    <Stack spacing={0.875} sx={{ mb: { xs: 1.75, md: 2 } }}>
      <Typography
        variant="caption"
        component="span"
        color="text.secondary"
        sx={{ fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block' }}
      >
        Vehicle type
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, v: SearchFilters['vehicleType'] | null) => v != null && onChange(v)}
        sx={compactSearchToggleSx(theme)}
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
