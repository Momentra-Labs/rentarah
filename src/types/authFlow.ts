/** Passed via `react-router` `location.state` to open auth without losing context. */
export type AuthLocationState = {
  auth?: boolean
  /** Which tab to show when opening {@link AuthDialog}. */
  authTab?: 'login' | 'register'
  /** After sign-in/register, continue to checkout for this vehicle. */
  pendingBookCarId?: string
  /** When opening Register, preselect this role (e.g. Host from /become-a-host); user may change. */
  defaultAccountRole?: 'renter' | 'host' | 'both'
}

/** Passed to `/complete-profile` — resume booking or deep link after onboarding. */
export type CompleteProfileLocationState = {
  from?: string
  pendingBookCarId?: string | null
}
