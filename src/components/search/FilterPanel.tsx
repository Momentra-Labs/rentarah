import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'

import type { SearchFilters } from '../../types'
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_VALUES } from '../../utils/vehicleUtils'
import SearchFilterPresets from './SearchFilterPresets'
import { compactSearchToggleSx, FILTER_SECTION_GAP } from './filterPanelStyles'

const BODY_TYPES = ['SUV', 'Sedan', 'Luxury', 'Budget', 'Electric', 'Truck'] as const

const VEHICLE_FILTER_OPTIONS: { value: SearchFilters['vehicleType']; label: string }[] = [
  { value: 'all', label: 'All' },
  ...VEHICLE_TYPE_VALUES.map((v) => ({ value: v, label: VEHICLE_TYPE_LABELS[v] })),
]

const TRANSMISSION_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'Automatic', label: 'Auto' },
  { value: 'Manual', label: 'Manual' },
] as const

const FUEL_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Electric', label: 'EV' },
  { value: 'Hybrid', label: 'Hybrid' },
] as const

const SEAT_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 2, label: '2+' },
  { value: 4, label: '4+' },
  { value: 5, label: '5+' },
  { value: 7, label: '7+' },
] as const

function SectionLabel({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Typography
      variant="caption"
      component="span"
      color="text.secondary"
      sx={{ fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', mb: 0.75, ...sx }}
    >
      {children}
    </Typography>
  )
}

interface FilterPanelProps {
  filters: SearchFilters
  onChange: (partial: Partial<SearchFilters>) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export default function FilterPanel({ filters, onChange, onClear, hasActiveFilters }: FilterPanelProps) {
  const theme = useTheme()
  const [min, max] = filters.priceRange
  const toggleSx = compactSearchToggleSx(theme)

  const priceLabel = `${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(min)} – ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(max)}`

  return (
    <Stack spacing={FILTER_SECTION_GAP}>
      {hasActiveFilters ? (
        <Button variant="text" color="primary" size="small" onClick={onClear} sx={{ alignSelf: 'flex-start', minHeight: 32, px: 0 }}>
          Clear all filters
        </Button>
      ) : null}

      <SearchFilterPresets onApply={onChange} />

      <Divider flexItem sx={{ opacity: 0.7 }} />

      <Box>
        <SectionLabel>Vehicle type</SectionLabel>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filters.vehicleType}
          onChange={(_, v: SearchFilters['vehicleType'] | null) => v != null && onChange({ vehicleType: v })}
          sx={toggleSx}
        >
          {VEHICLE_FILTER_OPTIONS.map((o) => (
            <ToggleButton key={o.value} value={o.value} aria-pressed={filters.vehicleType === o.value}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Divider flexItem sx={{ opacity: 0.7 }} />

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
          <Typography
            variant="caption"
            component="span"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}
          >
            Price / day
          </Typography>
          <Typography variant="caption" component="span" color="primary" fontWeight={800} sx={{ whiteSpace: 'nowrap' }}>
            {priceLabel}
          </Typography>
        </Stack>
        <Slider
          value={[min, max]}
          min={0}
          max={15000}
          step={250}
          size="small"
          valueLabelDisplay="auto"
          valueLabelFormat={(v) =>
            `₱${typeof v === 'number' ? new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 }).format(v) : v}`
          }
          onChange={(_, v) => onChange({ priceRange: v as [number, number] })}
          marks={[
            { value: 0, label: '₱0' },
            { value: 15000, label: '₱15k' },
          ]}
        />
      </Box>

      <Divider flexItem sx={{ opacity: 0.7 }} />

      <FormControlLabel
        control={<Switch checked={filters.availableOnly} onChange={(_, v) => onChange({ availableOnly: v })} size="small" />}
        label={
          <Box component="span" sx={{ typography: 'body2', fontWeight: 600 }}>
            Only show available dates
          </Box>
        }
        sx={{ m: 0, alignItems: 'center', py: 0 }}
      />

      <Divider flexItem sx={{ opacity: 0.7 }} />

      <Box>
        <SectionLabel>Body style (pick any)</SectionLabel>
        <ToggleButtonGroup
          exclusive={false}
          size="small"
          value={filters.types}
          onChange={(_, v) => onChange({ types: (v as string[]) ?? [] })}
          sx={toggleSx}
        >
          {BODY_TYPES.map((t) => (
            <ToggleButton key={t} value={t} aria-pressed={filters.types.includes(t)}>
              {t}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Divider flexItem sx={{ opacity: 0.7 }} />

      <Stack spacing={1.5} sx={{ width: '100%' }}>
        <Box sx={{ width: '100%' }}>
          <SectionLabel>Transmission</SectionLabel>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filters.transmission}
            onChange={(_, v) => v != null && onChange({ transmission: v })}
            sx={{
              ...toggleSx,
              width: '100%',
              justifyContent: 'flex-start',
            }}
          >
            {TRANSMISSION_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value} aria-pressed={filters.transmission === o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ width: '100%' }}>
          <SectionLabel>Fuel</SectionLabel>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filters.fuel}
            onChange={(_, v) => v != null && onChange({ fuel: v })}
            sx={{
              ...toggleSx,
              width: '100%',
              justifyContent: 'flex-start',
            }}
          >
            {FUEL_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value} aria-pressed={filters.fuel === o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Stack>

      <Divider flexItem sx={{ opacity: 0.7 }} />

      <Box>
        <SectionLabel>Min seats</SectionLabel>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filters.seats}
          onChange={(_, v) => v != null && onChange({ seats: v })}
          sx={toggleSx}
        >
          {SEAT_OPTIONS.map((o) => (
            <ToggleButton key={o.label} value={o.value} aria-pressed={filters.seats === o.value}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Stack>
  )
}
