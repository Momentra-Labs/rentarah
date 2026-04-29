import type { AuthUser } from '../types'

const PH_PHONE =
  /^(\+63|0)?[0-9]{10,11}$/

/** True when renter/driver legal + role fields match registration wizard requirements. */
export function isAuthProfileComplete(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  const fn = user.firstName?.trim() ?? ''
  const ln = user.lastName?.trim() ?? ''
  if (fn.length < 2 || ln.length < 2) return false
  const phone = user.phone?.replace(/\s/g, '') ?? ''
  if (!PH_PHONE.test(phone)) return false
  const license = user.licenseNumber?.trim() ?? ''
  if (license.length < 3) return false
  const role = user.accountRole
  return role === 'renter' || role === 'host' || role === 'both'
}
