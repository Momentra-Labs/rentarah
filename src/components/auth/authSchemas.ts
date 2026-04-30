import { z } from 'zod'

import {
  isValidPhilippineDriversLicense,
  normalizePhilippineDriversLicense,
  parsePhilippineMobileInputToNationalDigits,
} from '../../lib/philippineContact'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter the email you used to sign up')
    .email('That doesn’t look like a valid email'),
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const accountRoleSchema = z.enum(['renter', 'host', 'both'], {
  message: 'Please select your role to continue.',
})

/** Step 1 of wizard — user must explicitly pick a role (no implicit default). */
export const registerStepRoleSchema = z.object({
  accountRole: accountRoleSchema,
})

/** Step 2 — email only. */
export const registerStepEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter your email')
    .email('Use a valid email address'),
})

/** Step 3 — passwords. */
export const registerStepPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords need to match',
    path: ['confirmPassword'],
  })

/** National 10-digit field (+63 prefix in UI) → stored +639XXXXXXXXX. Paste 09… or 639… is tolerated. */
export const philippineMobileZod = z
  .string()
  .min(1, 'Enter your mobile number')
  .transform((s) => parsePhilippineMobileInputToNationalDigits(s))
  .refine((d) => d.length === 10 && /^9\d{9}$/.test(d), {
    message: 'Enter 10 digits after +63 starting with 9 (e.g. 9171234567). You can paste 09… or +639….',
  })
  .transform((d) => `+63${d}`)

/** LTO-style driver’s license (hyphenated or compact alphanumeric). */
export const philippineDriversLicenseZod = z
  .string()
  .min(1, 'Enter your driver’s license number')
  .transform((s) => normalizePhilippineDriversLicense(s))
  .refine((s) => isValidPhilippineDriversLicense(s), {
    message: 'Use your LTO license number (e.g. N12-34-567890 or N12345678).',
  })

/** Step 4 — identity + phone + license (required for rentals). */
export const registerStepProfileSchema = z.object({
  firstName: z.string().min(2, 'First name should be at least 2 characters'),
  lastName: z.string().min(2, 'Last name should be at least 2 characters'),
  phone: philippineMobileZod,
  licenseNumber: philippineDriversLicenseZod,
})

/** Canonical stored shape (submission). */
export const registerFullSchema = z
  .object({
    email: z.string().min(1).trim().email('Use a valid email address'),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: philippineMobileZod,
    licenseNumber: philippineDriversLicenseZod,
    accountRole: accountRoleSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords need to match',
    path: ['confirmPassword'],
  })

/** react-hook-form + UI: empty string until role is chosen (submission still uses registerFullSchema). */
export type RegisterFormValues = Omit<z.input<typeof registerFullSchema>, 'accountRole'> & {
  accountRole: z.input<typeof registerFullSchema>['accountRole'] | ''
}

/** Post–Google / incomplete OAuth — same bar as registration profile + role. */
export const completeProfileSchema = z.object({
  firstName: z.string().min(2, 'First name should be at least 2 characters'),
  lastName: z.string().min(2, 'Last name should be at least 2 characters'),
  phone: philippineMobileZod,
  licenseNumber: philippineDriversLicenseZod,
  accountRole: accountRoleSchema,
})

/** Form holds national 10 digits in `phone`; resolver outputs +639… into submit payload. */
export type CompleteProfileFormValues = z.input<typeof completeProfileSchema>
export type CompleteProfileSubmitValues = z.output<typeof completeProfileSchema>
