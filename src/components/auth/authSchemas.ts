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
  message: 'Choose how you’d like to use Rentara',
})

export type AccountRole = z.infer<typeof accountRoleSchema>

export const registerStep0Schema = z
  .object({
    email: z
      .string()
      .min(1, 'Enter your email')
      .email('Use a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords need to match',
    path: ['confirmPassword'],
  })

export const registerStep1Schema = z.object({
  firstName: z.string().min(2, 'First name should be at least 2 characters'),
  lastName: z.string().min(2, 'Last name should be at least 2 characters'),
  phone: z
    .string()
    .min(1, 'Enter your mobile number')
    .regex(/^(\+63|0)?[0-9]{10,11}$/, 'Use a PH mobile number (10–11 digits after +63 or 0)'),
})

export const registerStep2Schema = z.object({
  accountRole: accountRoleSchema,
})

/** Full payload for final submit (same rules as per-step schemas). */
export const registerFullSchema = z
  .object({
    email: z.string().min(1).email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z
      .string()
      .min(1)
      .regex(/^(\+63|0)?[0-9]{10,11}$/),
    accountRole: accountRoleSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords need to match',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerFullSchema>
