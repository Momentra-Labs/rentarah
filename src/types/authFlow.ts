/** Passed via `react-router` `location.state` to open auth without losing context. */
export type AuthLocationState = {
  auth?: boolean
  /** Which tab to show when opening {@link AuthDialog}. */
  authTab?: 'login' | 'register'
  /** After sign-in/register, continue to checkout for this vehicle. */
  pendingBookCarId?: string
}
