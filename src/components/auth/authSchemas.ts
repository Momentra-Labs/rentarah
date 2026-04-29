import { z } from 'zod'

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

/** Step 4 — identity + phone + license (required for rentals). */
export const registerStepProfileSchema = z.object({
  firstName: z.string().min(2, 'First name should be at least 2 characters'),
  lastName: z.string().min(2, 'Last name should be at least 2 characters'),
  phone: z
    .string()
    .min(1, 'Enter your mobile number')
    .regex(/^(\+63|0)?[0-9]{10,11}$/, 'Use a PH mobile number (10–11 digits after +63 or 0)'),
  licenseNumber: z
    .string()
    .min(3, 'Enter your driver’s license number')
    .regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers, or hyphens only'),
})

/** Canonical stored shape (submission). */
export const registerFullSchema = z
  .object({
    email: z.string().min(1).trim().email('Use a valid email address'),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z
      .string()
      .min(1)
      .regex(/^(\+63|0)?[0-9]{10,11}$/),
    licenseNumber: z
      .string()
      .min(3)
      .regex(/^[A-Za-z0-9-]+$/),
    accountRole: accountRoleSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords need to match',
    path: ['confirmPassword'],
  })

/** react-hook-form + UI: empty string until role is chosen (submission still uses registerFullSchema). */
export type RegisterFormValues = Omit<z.infer<typeof registerFullSchema>, 'accountRole'> & {
  accountRole: z.infer<typeof registerFullSchema>['accountRole'] | ''
}

/** Post–Google / incomplete OAuth — same bar as registration profile + role. */
export const completeProfileSchema = z.object({
  firstName: z.string().min(2, 'First name should be at least 2 characters'),
  lastName: z.string().min(2, 'Last name should be at least 2 characters'),
  phone: z
    .string()
    .min(1, 'Enter your mobile number')
    .regex(/^(\+63|0)?[0-9]{10,11}$/, 'Use a PH mobile number (10–11 digits after +63 or 0)'),
  licenseNumber: z
    .string()
    .min(3, 'Enter your driver’s license number')
    .regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers, or hyphens only'),
  accountRole: accountRoleSchema,
})

export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>
