import { Container, Stack, Typography } from '@mui/material'

import { containerGutters } from '../../theme/pageStyles'

export default function LegalPrivacyPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, ...containerGutters }}>
      <Typography variant="h4" component="h1" fontWeight={800} gutterBottom>
        Privacy overview
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Operational summary for onboarding — substitute your Data Privacy Act-aligned notice and DPIA artefacts.
      </Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Typography variant="body2">We collect what you voluntarily enter (identity, DL number, chats, payout metadata) plus basic session/device diagnostics to operate search, bookings, reminders, dispute tooling, fraud detection, and support.</Typography>
        <Typography variant="body2">Hosts may see renters’ trip-relevant verification details strictly to fulfill the rental; renters may see host-published listing + profile fields needed for meetups.</Typography>
        <Typography variant="body2">You can request corrections or deletion where law allows once you wire ticketing + compliance mailboxes in production.</Typography>
      </Stack>
    </Container>
  )
}
