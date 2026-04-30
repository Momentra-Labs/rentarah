import type { AuthUser } from '../types'

import {
  isValidPhilippineDriversLicense,
  normalizePhilippineDriversLicense,
  profilePhoneMeetsPhilippineMobileBar,
} from './philippineContact'

/** True when renter/driver legal + role fields match registration wizard requirements. */
export function isAuthProfileComplete(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  const fn = user.firstName?.trim() ?? ''
  const ln = user.lastName?.trim() ?? ''
  if (fn.length < 2 || ln.length < 2) return false
  if (!profilePhoneMeetsPhilippineMobileBar(user.phone)) return false

  const license = normalizePhilippineDriversLicense(user.licenseNumber ?? '')
  if (!isValidPhilippineDriversLicense(license)) return false

  const role = user.accountRole
  return role === 'renter' || role === 'host' || role === 'both'
}
