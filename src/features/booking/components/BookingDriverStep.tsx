import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { FormEventHandler } from 'react'
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'

import PhilippineDriversLicenseTextField from '@/components/auth/PhilippineDriversLicenseTextField'
import PhilippineNationalMobileTextField from '@/components/auth/PhilippineNationalMobileTextField'
import FriendlyDateTimePicker from '@/components/common/FriendlyDateTimePicker'
import PageHeader from '@/components/layout/PageHeader'
import { useT } from '@/hooks/useT'
import {
  formatPhilippineDriversLicenseInput,
  formatPhilippineMobileDisplay,
} from '@/lib/philippineContact'
import { listRowSurface, primaryCtaShadow } from '@/theme/pageStyles'
import type { AuthUser } from '@/types'

import type { DriverFormValues } from './driverSchema'

export type BookingDriverStepProps = {
  theme: Theme
  user: AuthUser | null
  editing: boolean
  onEdit: () => void
  dropoff: Dayjs
  register: UseFormRegister<DriverFormValues>
  control: Control<DriverFormValues>
  errors: FieldErrors<DriverFormValues>
  onBack: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  showFooter: boolean
  formId: string
}

export default function BookingDriverStep({
  theme,
  user,
  editing,
  onEdit,
  dropoff,
  register,
  control,
  errors,
  onBack,
  onSubmit,
  showFooter,
  formId,
}: BookingDriverStepProps) {
  const t = useT()
  const phoneDisplay = user ? formatPhilippineMobileDisplay(user.phone) ?? user.phone : ''
  const licenseDisplay = user ? formatPhilippineDriversLicenseInput(user.licenseNumber) : ''

  return (
    <Stack component="form" id={formId} spacing={2.5} onSubmit={onSubmit}>
      <PageHeader overline={t('booking.checkout')} title={t('booking.driverTitle')} subtitle={t('booking.driverSubtitle')} dense />

      {!editing && user ? (
        <Paper elevation={0} sx={{ p: 2, ...listRowSurface(theme) }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography fontWeight={800}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {phoneDisplay}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {licenseDisplay}
              </Typography>
            </Box>
            <Button size="small" onClick={onEdit} sx={{ textTransform: 'none', fontWeight: 700 }}>
              {t('booking.editDetails')}
            </Button>
          </Stack>
        </Paper>
      ) : (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('booking.firstName')}
              fullWidth
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
            <TextField
              label={t('booking.lastName')}
              fullWidth
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
          </Stack>
          <TextField
            label={t('booking.email')}
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhilippineNationalMobileTextField
                label={t('booking.phone')}
                fullWidth
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
                error={!!errors.phone}
                helperText={errors.phone?.message ?? t('booking.phoneHint')}
              />
            )}
          />
          <Controller
            name="licenseNumber"
            control={control}
            render={({ field }) => (
              <PhilippineDriversLicenseTextField
                label={t('booking.licenseNumber')}
                fullWidth
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
                error={!!errors.licenseNumber}
                helperText={errors.licenseNumber?.message ?? t('booking.licenseHint')}
              />
            )}
          />
        </>
      )}

      <Controller
        name="licenseExpiry"
        control={control}
        render={({ field }) => (
          <FriendlyDateTimePicker
            label={t('booking.licenseExpiry')}
            value={field.value ? dayjs(field.value) : null}
            onChange={(d) => field.onChange(d?.isValid() ? d.format('YYYY-MM-DD') : '')}
            showTime={false}
            minDate={dropoff}
            helperText={errors.licenseExpiry?.message ?? t('booking.licenseExpiryHint')}
            textFieldProps={{
              error: !!errors.licenseExpiry,
              onBlur: field.onBlur,
              name: field.name,
            }}
          />
        )}
      />

      <Controller
        name="isDriver"
        control={control}
        render={({ field }) => (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  name={field.name}
                  inputRef={field.ref}
                />
              }
              label={t('booking.confirmDriver')}
            />
            {errors.isDriver ? (
              <FormHelperText error sx={{ mx: 1.75, mt: 0 }}>
                {errors.isDriver.message}
              </FormHelperText>
            ) : null}
          </Box>
        )}
      />

      {showFooter ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
          <Button type="button" variant="outlined" onClick={onBack} sx={{ order: { xs: 2, sm: 1 } }}>
            {t('booking.back')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              order: { xs: 1, sm: 2 },
              minHeight: 48,
              borderRadius: 2,
              fontWeight: 800,
              textTransform: 'none',
              ...primaryCtaShadow(theme),
            }}
          >
            {t('booking.continue')}
          </Button>
        </Stack>
      ) : (
        <Button type="button" variant="outlined" onClick={onBack}>
          {t('booking.back')}
        </Button>
      )}
    </Stack>
  )
}
