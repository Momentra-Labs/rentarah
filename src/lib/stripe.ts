import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> | null {
  const key = import.meta.env.VITE_STRIPE_KEY as string | undefined
  if (!key) return null
  if (!stripePromise) {
    stripePromise = loadStripe(key)
  }
  return stripePromise
}
