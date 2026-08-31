import { Box, Paper, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'

import { dashboardTabsBarWrapSx, listRowSurface } from '@/theme/pageStyles'

export function PageHeaderSkeleton({
  dense = true,
  align = 'left',
  withOverline = true,
  withSubtitle = true,
}: {
  dense?: boolean
  align?: 'left' | 'center'
  withOverline?: boolean
  withSubtitle?: boolean
}) {
  return (
    <Stack
      spacing={1}
      sx={{
        mb: dense ? { xs: 2, md: 2.5 } : { xs: 3, md: 4 },
        maxWidth: 640,
        mx: align === 'center' ? 'auto' : undefined,
        alignItems: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {withOverline ? (
        <Skeleton variant="text" animation="wave" width={88} height={18} />
      ) : null}
      <Skeleton variant="text" animation="wave" width={align === 'center' ? 220 : 260} height={40} />
      {withSubtitle ? (
        <Skeleton variant="text" animation="wave" width="78%" height={20} />
      ) : null}
    </Stack>
  )
}

export function NextStepStripSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        mt: -0.5,
        px: { xs: 1.75, sm: 2 },
        py: 1.25,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
        <Skeleton variant="text" animation="wave" width="55%" height={22} />
        <Skeleton variant="rounded" animation="wave" width={88} height={32} sx={{ borderRadius: 2, flexShrink: 0 }} />
      </Stack>
    </Paper>
  )
}

export function DashboardTabsSkeleton({ count = 4 }: { count?: number }) {
  const theme = useTheme()
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true })
  const shown = isSmUp ? count : 3
  return (
    <Box sx={dashboardTabsBarWrapSx}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ minHeight: 52, px: { xs: 1, sm: 1.5 } }}
      >
        {Array.from({ length: shown }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            animation="wave"
            width={i === 0 ? 88 : 76}
            height={28}
            sx={{ borderRadius: 1, flexShrink: 0, flex: { xs: 1, sm: '0 0 auto' } }}
          />
        ))}
      </Stack>
    </Box>
  )
}

export function MediaRowSkeleton({
  imageWidth = 120,
  imageHeight = 72,
  actions = 3,
}: {
  imageWidth?: number
  imageHeight?: number
  actions?: number
}) {
  const theme = useTheme()
  return (
    <Paper elevation={0} sx={{ ...listRowSurface(theme), overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ p: 2, alignItems: { sm: 'center' } }}
      >
        <Skeleton
          variant="rounded"
          animation="wave"
          sx={{
            width: { xs: '100%', sm: imageWidth },
            height: { xs: 140, sm: imageHeight },
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="text" animation="wave" width="62%" height={24} />
          <Skeleton variant="text" animation="wave" width="44%" height={18} />
          <Skeleton variant="text" animation="wave" width="36%" height={18} />
        </Box>
        {actions > 0 ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
            {Array.from({ length: actions }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                animation="wave"
                width={i === 0 ? 72 : 64}
                height={28}
                sx={{ borderRadius: 1.5 }}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

export function ChatThreadRowSkeleton() {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ px: 2, py: 1.25 }}>
      <Skeleton variant="circular" animation="wave" width={44} height={44} sx={{ flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Skeleton variant="text" animation="wave" width="42%" height={20} />
          <Skeleton variant="text" animation="wave" width={48} height={16} />
        </Stack>
        <Skeleton variant="text" animation="wave" width="78%" height={16} />
      </Box>
    </Stack>
  )
}

export function NotificationRowSkeleton({ last = false }: { last?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
      sx={{
        px: 2,
        py: 1.75,
        borderBottom: last ? 0 : 1,
        borderColor: 'divider',
      }}
    >
      <Skeleton variant="circular" animation="wave" width={40} height={40} sx={{ flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" animation="wave" width="70%" height={20} />
        <Skeleton variant="text" animation="wave" width="92%" height={16} />
        <Skeleton variant="text" animation="wave" width="28%" height={14} />
      </Box>
    </Stack>
  )
}

export function NotificationInboxSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <NotificationRowSkeleton key={i} last={i === rows - 1} />
      ))}
    </Paper>
  )
}
