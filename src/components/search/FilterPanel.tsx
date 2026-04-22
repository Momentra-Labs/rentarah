import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

import type { SearchFilters } from '../../types'

const TYPES = ['SUV', 'Sedan', 'Luxury', 'Budget', 'Electric', 'Truck'] as const

interface FilterPanelProps {
  filters: SearchFilters
  onChange: (partial: Partial<SearchFilters>) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export default function FilterPanel({ filters, onChange, onClear, hasActiveFilters }: FilterPanelProps) {
  const [min, max] = filters.priceRange

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Price per day
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight={700} gutterBottom>
          {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(min)}{' '}
          –{' '}
          {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(max)}
        </Typography>
        <Slider
          value={[min, max]}
          min={0}
          max={15000}
          step={250}
          valueLabelDisplay="auto"
          onChange={(_, v) => onChange({ priceRange: v as [number, number] })}
          marks={[
            { value: 0, label: '₱0' },
            { value: 5000, label: '₱5k' },
            { value: 10000, label: '₱10k' },
            { value: 15000, label: '₱15k' },
          ]}
        />
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={filters.availableOnly}
            onChange={(_, v) => onChange({ availableOnly: v })}
          />
        }
        label="Available dates only"
      />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Car type
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={filters.types}
          onChange={(_, v) => onChange({ types: v as string[] })}
          sx={{ flexWrap: 'wrap', gap: 0.5 }}
        >
          {TYPES.map((t) => (
            <ToggleButton key={t} value={t} sx={{ textTransform: 'none' }}>
              {t}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <FormControl>
        <FormLabel>Transmission</FormLabel>
        <RadioGroup
          value={filters.transmission}
          onChange={(e) => onChange({ transmission: e.target.value })}
        >
          <FormControlLabel value="all" control={<Radio />} label="All" />
          <FormControlLabel value="Automatic" control={<Radio />} label="Automatic" />
          <FormControlLabel value="Manual" control={<Radio />} label="Manual" />
        </RadioGroup>
      </FormControl>

      <FormControl>
        <FormLabel>Fuel</FormLabel>
        <RadioGroup value={filters.fuel} onChange={(e) => onChange({ fuel: e.target.value })}>
          <FormControlLabel value="all" control={<Radio />} label="All" />
          <FormControlLabel value="Petrol" control={<Radio />} label="Petrol" />
          <FormControlLabel value="Diesel" control={<Radio />} label="Diesel" />
          <FormControlLabel value="Electric" control={<Radio />} label="Electric" />
          <FormControlLabel value="Hybrid" control={<Radio />} label="Hybrid" />
        </RadioGroup>
      </FormControl>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Min seats
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filters.seats}
          onChange={(_, v) => v != null && onChange({ seats: v })}
        >
          <ToggleButton value={0}>Any</ToggleButton>
          <ToggleButton value={2}>2</ToggleButton>
          <ToggleButton value={4}>4</ToggleButton>
          <ToggleButton value={5}>5</ToggleButton>
          <ToggleButton value={7}>7+</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {hasActiveFilters && (
        <Button variant="text" color="primary" onClick={onClear}>
          Clear all filters
        </Button>
      )}
    </Stack>
  )
}
