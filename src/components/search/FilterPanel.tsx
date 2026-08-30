import {
  Box,
  Button,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

import { useT } from '@/hooks/useT'

import type { SearchFilters } from '../../types'
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_VALUES } from '../../utils/vehicleUtils'
import { compactSearchToggleSx, FILTER_SECTION_GAP } from './filterPanelStyles'

const BODY_TYPES = ['SUV', 'Sedan', 'Luxury', 'Budget', 'Electric', 'Truck'] as const

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

const VEHICLE_TYPE_OPTIONS: { value: SearchFilters['vehicleType']; label: string }[] = [
  { value: 'all', label: 'All' },
  ...VEHICLE_TYPE_VALUES.map((v) => ({ value: v, label: VEHICLE_TYPE_LABELS[v] })),
]

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="body2"
      component="span"
      color="text.secondary"
      sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}
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
  /** Search page only — model-compare stays scoped without a type row. */
  showVehicleType?: boolean
}

export default function FilterPanel({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
  showVehicleType = false,
}: FilterPanelProps) {
  const t = useT()
  const theme = useTheme()
  const [min, max] = filters.priceRange
  const toggleSx = compactSearchToggleSx(theme)

  const priceLabel = `${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(min)} – ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(max)}`

  return (
    <Stack spacing={FILTER_SECTION_GAP}>
      {hasActiveFilters ? (
        <Button
          variant="text"
          color="primary"
          size="small"
          onClick={onClear}
          sx={{ alignSelf: 'flex-end', minHeight: 32, px: 0, mt: -0.5 }}
        >
          {t('search.clear')}
        </Button>
      ) : null}

      {showVehicleType && (
        <Box>
          <SectionLabel>{t('search.vehicle')}</SectionLabel>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filters.vehicleType}
            onChange={(_, v: SearchFilters['vehicleType'] | null) => v != null && onChange({ vehicleType: v })}
            sx={toggleSx}
          >
            {VEHICLE_TYPE_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value} aria-pressed={filters.vehicleType === o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      <Box>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="span" color="text.secondary" fontWeight={600}>
            {t('search.pricePerDay')}
          </Typography>
          <Typography variant="body2" component="span" color="text.primary" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
            {priceLabel}
          </Typography>
        </Stack>
        <Box sx={{ px: 1.5, pt: 0.75, pb: 0.25 }}>
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
            sx={{
              display: 'block',
              width: '100%',
              py: 0.5,
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
              },
            }}
          />
        </Box>
      </Box>

      <FormControlLabel
        control={<Switch checked={filters.availableOnly} onChange={(_, v) => onChange({ availableOnly: v })} size="small" />}
        label={
          <Box component="span" sx={{ typography: 'body2', fontWeight: 600 }}>
            Available dates only
          </Box>
        }
        sx={{ m: 0, alignItems: 'center', py: 0 }}
      />

      <Box>
        <SectionLabel>{t('search.body')}</SectionLabel>
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

      <Box>
        <SectionLabel>{t('search.transmission')}</SectionLabel>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filters.transmission}
          onChange={(_, v) => v != null && onChange({ transmission: v })}
          sx={toggleSx}
        >
          {TRANSMISSION_OPTIONS.map((o) => (
            <ToggleButton key={o.value} value={o.value} aria-pressed={filters.transmission === o.value}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box>
        <SectionLabel>{t('search.fuel')}</SectionLabel>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filters.fuel}
          onChange={(_, v) => v != null && onChange({ fuel: v })}
          sx={toggleSx}
        >
          {FUEL_OPTIONS.map((o) => (
            <ToggleButton key={o.value} value={o.value} aria-pressed={filters.fuel === o.value}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box>
        <SectionLabel>{t('search.seats')}</SectionLabel>
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
