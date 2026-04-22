import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'

const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#111827',
      fontFamily: 'Inter, sans-serif',
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
}

export default function StripePaymentForm({ onSuccess }: StripePaymentFormProps) {
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
        setError(pmError?.message ?? 'Payment failed')
        setLoading(false)
        return
      }
      await new Promise((r) => setTimeout(r, 1500))
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Test card: <strong>4242 4242 4242 4242</strong> · any future expiry · any CVC
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
      <Button variant="contained" size="large" disabled={!stripe || loading} onClick={handlePay}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Pay'}
      </Button>
    </Stack>
  )
}
