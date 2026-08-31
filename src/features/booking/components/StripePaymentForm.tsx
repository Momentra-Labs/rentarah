import { Alert, Box, Button, CircularProgress, Stack, Typography, useTheme } from '@mui/material'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'

import { useT } from '@/hooks/useT'
import { primaryCtaShadow } from '@/theme/pageStyles'

const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#111827',
      fontFamily: '"Urbanist", "Inter", sans-serif',
      '::placeholder': {
        color: '#6B7280',
      },
    },
    invalid: {
      color: '#DC2626',
    },
  },
}

interface StripePaymentFormProps {
  onSuccess: () => void
  amountLabel: string
}

export default function StripePaymentForm({ onSuccess, amountLabel }: StripePaymentFormProps) {
  const t = useT()
  const theme = useTheme()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return
    const card = elements.getElement(CardElement)
    if (!card) return
    setLoading(true)
    setError(null)
    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card,
      })
      if (pmError || !paymentMethod) {
        setError(pmError?.message ?? t('booking.payFailed'))
        setLoading(false)
        return
      }
      await new Promise((r) => setTimeout(r, 1500))
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('booking.payError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {t('booking.testCard', { number: '4242 4242 4242 4242' })}
      </Typography>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        <CardElement options={cardStyle} />
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        variant="contained"
        size="large"
        disabled={!stripe || loading}
        onClick={() => void handlePay()}
        sx={{ minHeight: 48, borderRadius: 2, fontWeight: 800, textTransform: 'none', ...primaryCtaShadow(theme) }}
      >
        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} color="inherit" />
            <span>{t('booking.confirming')}</span>
          </Stack>
        ) : (
          t('booking.payAmount', { amount: amountLabel })
        )}
      </Button>
    </Stack>
  )
}
