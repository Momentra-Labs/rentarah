import { Container, Stack, Typography } from '@mui/material'

import { containerGutters } from '../../theme/pageStyles'

export default function LegalTermsPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, ...containerGutters }}>
      <Typography variant="h4" component="h1" fontWeight={800} gutterBottom>
        Terms of Service
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Snapshot for marketplace demos — replace with counsel-approved terms before accepting real bookings or payouts.
      </Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Typography variant="body1">
          You use RentaraH to discover vehicle listings and optionally transact between independent hosts and renters. Nothing here is rental or insurance advice; always follow Philippine road law and licensing.
        </Typography>
        <Typography variant="subtitle2" fontWeight={800}>Accounts</Typography>
        <Typography variant="body2">Provide accurate identity, licenses, phone numbers, and email. We may suspend misuse, fraud signals, harassment, unsafe vehicles, or policy breaches.</Typography>
        <Typography variant="subtitle2" fontWeight={800}>Payments</Typography>
        <Typography variant="body2">Charges, holds, cancellations, deposits, taxes, tolls, and fuel rules follow the reservation you confirm at checkout unless the host communicates different legal addenda you accept separately.</Typography>
        <Typography variant="subtitle2" fontWeight={800}>Liability</Typography>
        <Typography variant="body2">Hosts and renters remain responsible for their actions, vehicle condition disclosures, collisions, roadside events, customs, tolls, and insurance elections. Replace this section entirely with insurer + counsel language.</Typography>
      </Stack>
    </Container>
  )
}
