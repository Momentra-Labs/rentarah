import { Box, Container, Divider, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider', py: { xs: 5, md: 6 }, mt: 'auto' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Rentara. Demo marketplace — payments & listings are simulated.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Typography component={RouterLink} to="/search" variant="body2" color="primary" sx={{ textDecoration: 'none' }}>
              Browse
            </Typography>
            <Typography component={RouterLink} to="/dashboard" variant="body2" color="primary" sx={{ textDecoration: 'none' }}>
              Dashboard
            </Typography>
          </Stack>
        </Stack>
        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" color="text.secondary">
          Stripe test mode · Philippine Peso (PHP) · Mock inventory & bookings
        </Typography>
      </Container>
    </Box>
  )
}
