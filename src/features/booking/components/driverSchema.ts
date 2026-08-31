import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { z } from 'zod'

import { philippineDriversLicenseZod, philippineMobileZod } from '@/components/auth/authSchemas'
import type { MessageKey, TranslateVars } from '@/i18n/translate'
import type { AuthUser } from '@/types'

export type DriverFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  isDriver: boolean
}

type Translate = (key: MessageKey, vars?: TranslateVars) => string

export function createDriverSchema(t: Translate, getReturnDate: () => Dayjs | null) {
  return z
    .object({
      firstName: z.string().min(2, t('booking.errRequired')),
      lastName: z.string().min(2, t('booking.errRequired')),
      email: z.string().email(t('booking.errEmail')),
      phone: philippineMobileZod,
      licenseNumber: philippineDriversLicenseZod,
      licenseExpiry: z.string().min(1, t('booking.errExpiry')),
      isDriver: z.boolean().refine((v) => v === true, { message: t('booking.errConfirmDriver') }),
    })
    .superRefine((data, ctx) => {
      const exp = dayjs(data.licenseExpiry)
      if (!exp.isValid()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['licenseExpiry'], message: t('booking.errExpiry') })
        return
      }
      const ret = getReturnDate()
      if (ret?.isValid() && exp.isBefore(ret, 'day')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['licenseExpiry'],
          message: t('booking.errExpiryBeforeReturn'),
        })
      }
    })
}

export function hasCompleteDriverProfile(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return (
    user.firstName.trim().length >= 2 &&
    user.lastName.trim().length >= 2 &&
    user.email.trim().length > 0 &&
    user.phone.trim().length > 0 &&
    user.licenseNumber.trim().length > 0
  )
}
