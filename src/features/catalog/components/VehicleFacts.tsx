import LocalGasStationOutlined from '@mui/icons-material/LocalGasStationOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import SpeedOutlined from '@mui/icons-material/SpeedOutlined'
import SportsMotorsportsOutlined from '@mui/icons-material/SportsMotorsportsOutlined'
import TwoWheelerOutlined from '@mui/icons-material/TwoWheelerOutlined'
import { Box, Stack, Typography } from '@mui/material'
import type { ReactElement } from 'react'

import { useT } from '@/hooks/useT'
import { rhRadius } from '@/theme/tokens'
import type { Car } from '@/types'
import { isTwoWheeler } from '@/utils/vehicleUtils'

type Fact = { key: string; icon: ReactElement; label: string; value: string }

function FactTile({ icon, label, value }: { icon: ReactElement; label: string; value: string }) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{
        p: 1.25,
        borderRadius: `${rhRadius.md}px`,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'action.hover',
          color: 'text.secondary',
          flexShrink: 0,
        }}
        aria-hidden
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={650} display="block" noWrap>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}

export default function VehicleFacts({ car }: { car: Car }) {
  const t = useT()
  const twoWheeler = isTwoWheeler(car)
  const iconSx = { fontSize: 20 }

  const facts: Fact[] = [
    {
      key: 'seats',
      icon: <PeopleOutlined sx={iconSx} />,
      label: t('detail.seatsLabel'),
      value: String(car.seats),
    },
    {
      key: 'trans',
      icon: <SettingsOutlined sx={iconSx} />,
      label: t('detail.transmission'),
      value: car.transmission,
    },
    {
      key: 'fuel',
      icon: <LocalGasStationOutlined sx={iconSx} />,
      label: t('detail.fuel'),
      value: car.fuel,
    },
  ]

  if (car.odometer) {
    facts.push({
      key: 'odo',
      icon: <SpeedOutlined sx={iconSx} />,
      label: t('detail.odometer'),
      value: car.odometer,
    })
  }

  if (twoWheeler && car.engineCapacity != null) {
    facts.push({
      key: 'cc',
      icon: <TwoWheelerOutlined sx={iconSx} />,
      label: t('detail.engine'),
      value: t('detail.engineCc', { count: car.engineCapacity }),
    })
  }

  if (twoWheeler && car.helmetIncluded != null) {
    facts.push({
      key: 'helmet',
      icon: <SportsMotorsportsOutlined sx={iconSx} />,
      label: t('detail.helmet'),
      value: car.helmetIncluded ? t('detail.helmetIncluded') : t('detail.helmetNotIncluded'),
    })
  }

  return (
    <Box
      sx={{
        mt: 2,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(auto-fill, minmax(160px, 1fr))' },
        gap: 1,
      }}
    >
      {facts.map((f) => (
        <FactTile key={f.key} icon={f.icon} label={f.label} value={f.value} />
      ))}
    </Box>
  )
}
