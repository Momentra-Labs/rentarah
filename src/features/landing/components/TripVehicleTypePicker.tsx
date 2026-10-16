import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import GridViewOutlined from '@mui/icons-material/GridViewOutlined'
import MopedOutlined from '@mui/icons-material/MopedOutlined'
import SportsMotorsportsOutlined from '@mui/icons-material/SportsMotorsportsOutlined'
import TwoWheelerOutlined from '@mui/icons-material/TwoWheelerOutlined'
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'

import { useT } from '@/hooks/useT'
import type { MessageKey } from '@/i18n/translate'
import { rhRadius } from '@/theme/tokens'
import type { SearchFilters } from '@/types'

export type TripVehicleType = SearchFilters['vehicleType']

const OPTIONS: { value: TripVehicleType; labelKey: MessageKey; shortKey?: MessageKey; Icon: SvgIconComponent }[] = [
  { value: 'all', labelKey: 'landing.vtAny', Icon: GridViewOutlined },
  { value: 'car', labelKey: 'landing.vtCar', Icon: DirectionsCarOutlined },
  { value: 'motorcycle', labelKey: 'landing.vtMotorcycle', shortKey: 'landing.vtMotorcycleShort', Icon: TwoWheelerOutlined },
  { value: 'scooter', labelKey: 'landing.vtScooter', Icon: MopedOutlined },
  { value: 'bigbike', labelKey: 'landing.vtBigbike', Icon: SportsMotorsportsOutlined },
]

export type TripVehicleTypePickerProps = {
  value: TripVehicleType
  onChange: (next: TripVehicleType) => void
  /** Types with at least one listing; others are hidden so nobody picks a dead end. */
  availableTypes: ReadonlySet<TripVehicleType>
}

/** Icon-over-label segmented control — the first decision a renter makes, so it leads the form. */
export default function TripVehicleTypePicker({ value, onChange, availableTypes }: TripVehicleTypePickerProps) {
  const t = useT()
  const options = OPTIONS.filter((o) => o.value === 'all' || availableTypes.has(o.value))

  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      value={value}
      onChange={(_, next: TripVehicleType | null) => {
        if (next) onChange(next)
      }}
      aria-label={t('landing.vehicleTypeAria')}
      sx={{
        gap: { xs: 0.5, sm: 0.75 },
        '& .MuiToggleButtonGroup-grouped': {
          // Separate tiles, not a fused bar — each needs its own border and radius.
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${rhRadius.md}px !important`,
          m: 0,
        },
      }}
    >
      {options.map(({ value: v, labelKey, shortKey, Icon }) => (
        <ToggleButton
          key={v}
          value={v}
          sx={{
            flex: 1,
            minWidth: 0,
            flexDirection: 'column',
            gap: 0.25,
            py: { xs: 0.75, sm: 0.9 },
            px: 0.5,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: { xs: '0.6875rem', sm: '0.75rem' },
            lineHeight: 1.2,
            color: 'text.secondary',
            bgcolor: 'background.paper',
            transition: 'background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease, box-shadow 140ms ease',
            '& .MuiSvgIcon-root': { fontSize: { xs: 20, sm: 22 } },
            '&:hover': {
              bgcolor: (th) => alpha(th.palette.primary.main, 0.05),
              borderColor: (th) => `${alpha(th.palette.primary.main, 0.35)} !important`,
              color: 'primary.main',
            },
            '@media (hover: hover) and (pointer: fine)': {
              '&:hover': { transform: 'translateY(-1px)' },
            },
            '&.Mui-selected, &.Mui-selected:hover': {
              color: 'common.white',
              background: (th) => `linear-gradient(160deg, #3B82F6, ${th.palette.primary.main})`,
              borderColor: (th) => `${th.palette.primary.main} !important`,
              boxShadow: (th) => `0 8px 18px ${alpha(th.palette.primary.main, 0.3)}`,
            },
            '&.Mui-focusVisible': { boxShadow: 'var(--rh-focus-ring)' },
          }}
        >
          <Icon aria-hidden />
          <Box
            component="span"
            sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
          >
            {shortKey ? (
              <>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  {t(shortKey)}
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {t(labelKey)}
                </Box>
              </>
            ) : (
              t(labelKey)
            )}
          </Box>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
