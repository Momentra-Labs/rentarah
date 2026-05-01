import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
}

export default function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        position: 'relative',
        p: { xs: 2, sm: 2.25 },
        pt: { xs: 2.125, sm: 2.375 },
        borderRadius: 2.5,
        height: '100%',
        overflow: 'hidden',
        bgcolor: alpha('#FFFFFF', 0.92),
        borderColor: alpha('#CBD5F5', 0.45),
        boxShadow: '0 1px 2px rgba(15,23,42,0.06), 0 12px 40px rgba(26,86,219,0.06)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 3,
          background: `linear-gradient(90deg, ${alpha('#1A56DB', 0.92)} 0%, ${alpha('#6366f1', 0.72)} 100%)`,
          borderRadius: '12px 12px 0 0',
        }}
      />
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {label}
          </Typography>
          {icon ? (
            <Box
              sx={{
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha('#1A56DB', 0.07),
                color: 'primary.main',
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Stack>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.04em" sx={{ fontSize: { xs: '1.625rem', sm: '2rem' }, lineHeight: 1.1 }}>
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, display: 'block' }}>
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  )
}
