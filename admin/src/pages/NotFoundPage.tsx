import SearchOffRounded from '@mui/icons-material/SearchOffRounded'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Box sx={{ py: { xs: 4, md: 8 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3.5, sm: 5 },
          maxWidth: 440,
          width: '100%',
          borderRadius: 3,
          textAlign: 'center',
          border: '1px solid',
          borderColor: alpha('#cbd5f5', 0.55),
          background: `linear-gradient(160deg, #fff 0%, ${alpha('#eff6ff', 0.55)} 100%)`,
          boxShadow: '0 16px 60px rgba(26,86,219,0.08)',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '22px',
              bgcolor: alpha('#1a56db', 0.08),
              color: 'primary.main',
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${alpha('#1a56db', 0.12)}`,
            }}
          >
            <SearchOffRounded sx={{ fontSize: 38 }} aria-hidden />
          </Box>
          <Stack spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 830, letterSpacing: '-0.03em', color: '#0f172a' }}>
              No admin page here
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 0, sm: 1 }, lineHeight: 1.7 }}>
              The URL does not resolve to any RentaraH operations screen. Confirm the path or return to Mission Control.
            </Typography>
          </Stack>
          <Button component={RouterLink} to="/" variant="contained" size="large" sx={{ minWidth: 200, px: 3 }}>
            Back to overview
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
