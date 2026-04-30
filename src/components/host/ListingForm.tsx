import Close from '@mui/icons-material/Close'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useRef, useState } from 'react'

import { DEFAULT_SEARCH_LOCATION } from '../../constants/geo'
import type { Car, VehicleType } from '../../types'
import { useAuthStore } from '../../store/useAuthStore'
import { useCarsStore } from '../../store/useCarsStore'
import { useSnackbarStore } from '../../store/useSnackbarStore'
import { primaryCtaShadow } from '../../theme/pageStyles'
import { formatPeso } from '../../utils/formatCurrency'
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_VALUES } from '../../utils/vehicleUtils'

const STEP_LABELS = ['Basics', 'Specs & pickup', 'Features', 'Review'] as const

const STEP_HELPER: readonly string[] = [
  'Name your vehicle, set a fair daily rate, and write a quick pitch—most hosts finish this in under two minutes.',
  'Mechanicals and pickup details help renters know what to expect at handover.',
  'Highlight comforts and tech renters filter for. Skip anything that does not apply.',
  'You can edit pricing and details anytime after publishing.',
]
const DESCRIPTION_MIN_LEN = 10
const MAKER_MODEL_MIN = 2

/** Model year options: rolling window for quick pick + still allow custom via year field UX */
function yearMenuItems() {
  const y = new Date().getFullYear()
  const out: number[] = []
  for (let i = y + 1; i >= y - 30; i -= 1) out.push(i)
  return out
}

const FEATURE_OPTIONS = [
  'Apple CarPlay',
  'Backup Camera',
  'Keyless Entry',
  'Heated Seats',
  'Sunroof',
  'Bluetooth',
  'USB-C',
  'Dashcam',
  'Parking Sensors',
  '360° Camera',
]

const CAR_TYPES = ['SUV', 'Sedan', 'Luxury', 'Budget', 'Electric', 'Truck'] as const

const TWO_WHEELER_BODY_TYPES = [
  'Scooter',
  'Naked',
  'Sport',
  'Cruiser',
  'Electric',
  'Touring',
  'Cafe Racer',
  'Adventure',
  'Moped',
] as const

const PLACEHOLDER_IMAGE: Record<VehicleType, string> = {
  car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop',
  motorcycle: 'https://images.unsplash.com/photo-1558980664-1db506751c3d?w=800&auto=format&fit=crop',
  scooter: 'https://images.unsplash.com/photo-1611250506729-1dd776f09033?w=800&auto=format&fit=crop',
  bigbike: 'https://images.unsplash.com/photo-1568702846914-96b0d1d58ac7?w=800&auto=format&fit=crop',
}

export interface ListingFormProps {
  open: boolean
  onClose: () => void
  /** When set, the form loads that listing and updates it on save. */
  editingCarId?: string | null
}

type FormState = {
  vehicleType: VehicleType
  make: string
  model: string
  year: string
  type: string
  pricePerDay: string
  description: string
  seats: number
  transmission: string
  fuel: string
  odometer: string
  location: string
  plateNumber: string
  engineCapacity: string
  helmetIncluded: boolean
  features: Record<string, boolean>
}

const initialForm = (): FormState => ({
  vehicleType: 'car',
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  type: 'SUV',
  pricePerDay: '',
  description: '',
  seats: 5,
  transmission: 'Automatic',
  fuel: 'Petrol',
  odometer: '',
  location: DEFAULT_SEARCH_LOCATION,
  plateNumber: '',
  engineCapacity: '',
  helmetIncluded: true,
  features: Object.fromEntries(FEATURE_OPTIONS.map((f) => [f, false])) as Record<string, boolean>,
})

function carToForm(car: Car): FormState {
  const base = initialForm()
  const feat = { ...base.features }
  for (const f of car.features) {
    if (f in feat) feat[f] = true
  }
  const isCar = car.vehicleType === 'car'
  const transmission =
    !isCar && car.transmissionType
      ? car.transmissionType === 'manual'
        ? 'Manual'
        : 'Automatic'
      : /manual/i.test(car.transmission)
        ? 'Manual'
        : 'Automatic'
  const odo = car.odometer === '—' ? '' : car.odometer
  return {
    ...base,
    vehicleType: car.vehicleType,
    make: car.make,
    model: car.model,
    year: String(car.year),
    type: car.type,
    pricePerDay: String(car.pricePerDay),
    description: car.description,
    seats: car.seats,
    transmission,
    fuel: car.fuel,
    odometer: odo,
    location: car.location,
    plateNumber: car.plateNumber,
    engineCapacity: car.engineCapacity != null ? String(car.engineCapacity) : '',
    helmetIncluded: car.helmetIncluded ?? true,
    features: feat,
  }
}

function formSnapshotKey(f: FormState): string {
  return JSON.stringify(f)
}

export default function ListingForm({ open, onClose, editingCarId = null }: ListingFormProps) {
  const user = useAuthStore((s) => s.user)
  const addListing = useCarsStore((s) => s.addListing)
  const updateListing = useCarsStore((s) => s.updateListing)
  const getCarById = useCarsStore((s) => s.getCarById)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [initialSnapshot, setInitialSnapshot] = useState<FormState | null>(null)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [showIssuesStep0, setShowIssuesStep0] = useState(false)
  const [showIssuesStep1, setShowIssuesStep1] = useState(false)
  const theme = useTheme()
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'))
  const isEditing = Boolean(editingCarId)

  const contentScrollRef = useRef<HTMLDivElement>(null)
  const yearOptions = useMemo(() => yearMenuItems(), [])
  const sectionSx = useMemo(
    () => ({
      p: { xs: 2, sm: 2.25 },
      borderRadius: 2.5,
      border: 1,
      borderColor: 'divider',
      bgcolor: alpha(theme.palette.primary.main, 0.025),
      boxShadow: 'none',
    }),
    [theme],
  )

  useEffect(() => {
    if (showIssuesStep0 || showIssuesStep1) {
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [showIssuesStep0, showIssuesStep1])

  useEffect(() => {
    if (!open) {
      setInitialSnapshot(null)
      setDiscardDialogOpen(false)
      setShowIssuesStep0(false)
      setShowIssuesStep1(false)
      return
    }
    if (editingCarId) {
      const car = getCarById(editingCarId)
      if (car) {
        const next = carToForm(car)
        setForm(next)
        setStep(0)
        setInitialSnapshot(next)
        setShowIssuesStep0(false)
        setShowIssuesStep1(false)
        return
      }
      showError('Could not load that listing.')
      onClose()
      return
    }
    const next = initialForm()
    setForm(next)
    setStep(0)
    setInitialSnapshot(next)
    setShowIssuesStep0(false)
    setShowIssuesStep1(false)
  }, [open, editingCarId, getCarById, onClose, showError])

  const selectedFeatures = useMemo(
    () => Object.entries(form.features).filter(([, v]) => v).map(([k]) => k),
    [form.features],
  )

  const shouldConfirmDiscard = useMemo(() => {
    if (!open || !initialSnapshot) return false
    if (step > 0) return true
    return formSnapshotKey(form) !== formSnapshotKey(initialSnapshot)
  }, [open, initialSnapshot, form, step])

  const resetAndClose = () => {
    setStep(0)
    setForm(initialForm())
    setInitialSnapshot(null)
    setDiscardDialogOpen(false)
    setShowIssuesStep0(false)
    setShowIssuesStep1(false)
    onClose()
  }

  const requestClose = () => {
    if (shouldConfirmDiscard) {
      setDiscardDialogOpen(true)
    } else {
      resetAndClose()
    }
  }

  const handleMainDialogClose = (_event: object, _reason: 'backdropClick' | 'escapeKeyDown') => {
    requestClose()
  }

  const handleSubmit = () => {
    if (!user) return
    const price = parseInt(form.pricePerDay, 10)
    if (Number.isNaN(price) || price < 0) {
      showError('Enter a valid daily price in Philippine pesos.')
      return
    }

    const isCar = form.vehicleType === 'car'
    const engineParsed = form.engineCapacity.trim() ? parseInt(form.engineCapacity.trim(), 10) : NaN
    const engineOk = Number.isFinite(engineParsed) && !Number.isNaN(engineParsed)

    const twoWheelerFields = !isCar
      ? {
          ...(engineOk ? { engineCapacity: engineParsed } : {}),
          transmissionType: (form.transmission === 'Automatic' ? 'automatic' : 'manual') as 'automatic' | 'manual',
          helmetIncluded: form.helmetIncluded,
        }
      : {}

    const featureList = selectedFeatures.length ? selectedFeatures : ['Bluetooth']
    const commonFields = {
      vehicleType: form.vehicleType,
      make: form.make.trim(),
      model: form.model.trim(),
      year: parseInt(form.year, 10) || new Date().getFullYear(),
      type: form.type,
      pricePerDay: price,
      transmission: form.transmission,
      fuel: form.fuel,
      odometer: form.odometer.trim() || '—',
      seats: form.seats,
      features: featureList,
      location: form.location.trim() || DEFAULT_SEARCH_LOCATION,
      description: form.description.trim() || 'Hosted on RentaraH.',
      plateNumber: form.plateNumber.trim().toUpperCase() || 'NEW LST',
      ...twoWheelerFields,
    } satisfies Partial<Car>

    if (isEditing && editingCarId) {
      const ex = getCarById(editingCarId)
      if (!ex) {
        showError('This listing is no longer available.')
        return
      }
      updateListing(editingCarId, {
        ...commonFields,
        images: ex.images,
        tags: ex.tags,
        bookedDates: ex.bookedDates,
        rating: ex.rating,
        reviewCount: ex.reviewCount,
        available: ex.available,
        hostId: ex.hostId,
        hostName: ex.hostName,
        hostAvatar: ex.hostAvatar,
        hostTrips: ex.hostTrips,
        hostResponseTime: ex.hostResponseTime,
        pickupLat: ex.pickupLat,
        pickupLng: ex.pickupLng,
      })
      showSuccess('Listing updated.')
    } else {
      const payload: Omit<Car, 'id' | 'rating' | 'reviewCount' | 'bookedDates'> & { bookedDates?: string[] } = {
        ...commonFields,
        images: [PLACEHOLDER_IMAGE[form.vehicleType]],
        tags: ['New'],
        available: true,
        hostId: user.id,
        hostName: `${user.firstName} ${user.lastName}`,
        hostAvatar: user.avatar,
        hostTrips: 0,
        hostResponseTime: '< 1 hour',
        bookedDates: [],
      }
      addListing(payload)
      showSuccess('New listing added!')
    }
    resetAndClose()
  }

  const canNextStep0 =
    form.make.trim().length >= MAKER_MODEL_MIN &&
    form.model.trim().length >= 1 &&
    form.pricePerDay !== '' &&
    !Number.isNaN(parseInt(form.pricePerDay, 10)) &&
    parseInt(form.pricePerDay, 10) >= 0 &&
    form.description.trim().length >= DESCRIPTION_MIN_LEN &&
    form.year.trim() !== '' &&
    !Number.isNaN(parseInt(form.year, 10)) &&
    (() => {
      const y = parseInt(form.year, 10)
      return y >= 1980 && y <= new Date().getFullYear() + 1
    })()

  const canNextStep1 =
    form.odometer.trim().length >= 1 &&
    form.location.trim().length >= 2 &&
    form.plateNumber.trim().length >= 3

  const goNext = () => {
    if (step === 0) {
      if (!canNextStep0) {
        setShowIssuesStep0(true)
        return
      }
      setShowIssuesStep0(false)
    }
    if (step === 1) {
      if (!canNextStep1) {
        setShowIssuesStep1(true)
        return
      }
      setShowIssuesStep1(false)
    }
    setStep((s) => Math.min(3, s + 1))
  }

  const handleFeatureToggle = (key: string) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }))
  }

  const priceNumeric = parseInt(form.pricePerDay, 10)
  const yearNumeric = parseInt(form.year, 10)
  const maxModelYear = new Date().getFullYear() + 1
  const yearFieldInvalid =
    showIssuesStep0 &&
    (form.year.trim() === '' || Number.isNaN(yearNumeric) || yearNumeric < 1980 || yearNumeric > maxModelYear)

  return (
    <>
      <Dialog
        open={open}
        onClose={handleMainDialogClose}
        maxWidth="md"
        fullWidth
        fullScreen={isSmDown}
        scroll="paper"
        disableRestoreFocus
        PaperProps={{
          sx: {
            borderRadius: isSmDown ? 0 : { xs: 2, sm: 3 },
            maxHeight: isSmDown ? '100%' : { xs: '100%', sm: 'min(720px, 92vh)' },
          },
        }}
      >
        <DialogTitle
          sx={{
            pr: 6,
            pt: 2.5,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <IconButton
            type="button"
            aria-label="Close listing form"
            onClick={() => requestClose()}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>
            {isEditing ? 'Edit listing' : 'New listing'}
          </Typography>
          <Typography component="div" variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', pr: 2, lineHeight: 1.25 }}>
            {STEP_LABELS[step]}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, pr: 2, lineHeight: 1.55 }}>
            {STEP_HELPER[step]}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.75, pr: 2, display: 'block', fontWeight: 600 }}>
            Step {step + 1} of 4 · unsaved changes are discarded when you close
          </Typography>
          <Stepper
            activeStep={step}
            alternativeLabel={!isSmDown}
            sx={{
              width: '100%',
              mt: 2.5,
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                fontWeight: 600,
                lineHeight: 1.2,
              },
              '& .MuiStepLabel-label.Mui-active': { color: 'primary.main', fontWeight: 800 },
              '& .MuiStepLabel-label.Mui-completed': { color: 'text.secondary' },
            }}
          >
            {STEP_LABELS.map((label, i) => (
              <Step key={label} completed={step > i}>
                <StepLabel>{isSmDown ? label.split(' ')[0] : label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <LinearProgress
            variant="determinate"
            value={25 * (step + 1)}
            sx={{
              mt: 2,
              height: 4,
              borderRadius: 99,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              '& .MuiLinearProgress-bar': { borderRadius: 99 },
            }}
          />
        </DialogTitle>
        <DialogContent ref={contentScrollRef} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
          {step === 0 && (
            <Stack spacing={2.5} sx={{ mt: 0.5 }}>
              {showIssuesStep0 ? (
                <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                  Fix the highlighted fields to continue — make, model, year, daily rate, and a short description are
                  required before you move on.
                </Alert>
              ) : null}
              <Paper elevation={0} sx={sectionSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 800, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}
                >
                  Vehicle category
                </Typography>
                <Grid container spacing={1.25}>
                  {VEHICLE_TYPE_VALUES.map((v) => {
                    const selected = form.vehicleType === v
                    return (
                      <Grid item xs={6} sm={3} key={v}>
                        <Paper
                          component="button"
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              vehicleType: v,
                              seats: v === 'car' ? 5 : 2,
                              type: v === 'car' ? f.type : TWO_WHEELER_BODY_TYPES[0],
                            }))
                          }
                          elevation={0}
                          sx={{
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            p: 1.75,
                            borderRadius: 2,
                            border: 2,
                            borderColor: selected ? 'primary.main' : 'divider',
                            bgcolor: selected
                              ? alpha(theme.palette.primary.main, 0.08)
                              : alpha(theme.palette.grey[theme.palette.mode === 'dark' ? 800 : 200], theme.palette.mode === 'dark' ? 0.35 : 0.25),
                            transition: theme.transitions.create(['border-color', 'background-color'], {
                              duration: 160,
                            }),
                            '&:focus-visible': {
                              outline: `2px solid ${theme.palette.primary.main}`,
                              outlineOffset: 2,
                            },
                          }}
                          aria-pressed={selected}
                          aria-label={`List as ${VEHICLE_TYPE_LABELS[v]}`}
                        >
                          <Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                            {VEHICLE_TYPE_LABELS[v]}
                          </Typography>
                        </Paper>
                      </Grid>
                    )
                  })}
                </Grid>
              </Paper>
              <Paper elevation={0} sx={sectionSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 800, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}
                >
                  Identity
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Make"
                      value={form.make}
                      onChange={(e) => setForm({ ...form, make: e.target.value })}
                      autoComplete="organization"
                      fullWidth
                      required
                      size="small"
                      error={showIssuesStep0 && form.make.trim().length < MAKER_MODEL_MIN}
                      helperText={
                        showIssuesStep0 && form.make.trim().length < MAKER_MODEL_MIN
                          ? `At least ${MAKER_MODEL_MIN} characters`
                          : undefined
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Model"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      autoComplete="off"
                      fullWidth
                      required
                      size="small"
                      error={showIssuesStep0 && form.model.trim().length < 1}
                      helperText={showIssuesStep0 && form.model.trim().length < 1 ? 'Model is required' : undefined}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" error={yearFieldInvalid}>
                      <InputLabel id="list-year">Model year</InputLabel>
                      <Select
                        labelId="list-year"
                        label="Model year"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: String(e.target.value) })}
                        sx={{ borderRadius: 2 }}
                      >
                        {form.year.trim() !== '' && !yearOptions.includes(yearNumeric) ? (
                          <MenuItem value={form.year}>{form.year}</MenuItem>
                        ) : null}
                        {yearOptions.map((y) => (
                          <MenuItem key={y} value={String(y)}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                      {yearFieldInvalid ? (
                        <FormHelperText sx={{ mx: 0 }}>
                          {form.year.trim() === ''
                            ? 'Choose a model year'
                            : `Use a year between 1980 and ${maxModelYear}.`}
                        </FormHelperText>
                      ) : null}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Body / segment</InputLabel>
                      <Select
                        label="Body / segment"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        sx={{ borderRadius: 2 }}
                      >
                        {(form.vehicleType === 'car' ? CAR_TYPES : TWO_WHEELER_BODY_TYPES).map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
              <Paper elevation={0} sx={sectionSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 800, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}
                >
                  Pricing & description
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Daily rate"
                    type="number"
                    value={form.pricePerDay}
                    onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
                    fullWidth
                    required
                    size="small"
                    error={showIssuesStep0 && (form.pricePerDay === '' || Number.isNaN(priceNumeric) || priceNumeric < 0)}
                    helperText={
                      showIssuesStep0 && (form.pricePerDay === '' || Number.isNaN(priceNumeric) || priceNumeric < 0)
                        ? 'Enter a valid amount'
                        : 'Per calendar day before platform fees'
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                      inputProps: { min: 0, step: 50 },
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    label="Description for renters"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    fullWidth
                    required
                    multiline
                    minRows={4}
                    size="small"
                    error={showIssuesStep0 && form.description.trim().length < DESCRIPTION_MIN_LEN}
                    helperText={
                      showIssuesStep0 && form.description.trim().length < DESCRIPTION_MIN_LEN
                        ? `At least ${DESCRIPTION_MIN_LEN} characters`
                        : `${form.description.trim().length}/${DESCRIPTION_MIN_LEN} minimum · condition, house rules, extras`
                    }
                    placeholder="e.g. Well-maintained daily driver, no smoking, includes phone mount and charging cable."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Stack>
              </Paper>
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={2.5} sx={{ mt: 0.5 }}>
              {showIssuesStep1 ? (
                <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                  Add odometer reading, pickup area, and plate number so renters know what to expect.
                </Alert>
              ) : null}
              <Paper elevation={0} sx={sectionSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 800, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}
                >
                  Mechanical & capacity
                </Typography>
                <Grid container spacing={2}>
                  {form.vehicleType !== 'car' ? (
                    <Grid item xs={12}>
                      <TextField
                        label="Engine capacity (cc)"
                        value={form.engineCapacity}
                        onChange={(e) => setForm({ ...form, engineCapacity: e.target.value.replace(/\D/g, '') })}
                        fullWidth
                        size="small"
                        inputProps={{ inputMode: 'numeric' }}
                        helperText="Optional in demo — helps filter-savvy renters"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  ) : null}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Seats</InputLabel>
                      <Select
                        label="Seats"
                        value={String(form.seats)}
                        onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                        sx={{ borderRadius: 2 }}
                      >
                        {(form.vehicleType === 'car' ? [2, 4, 5, 7] : [1, 2]).map((n) => (
                          <MenuItem key={n} value={n}>
                            {n}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {form.vehicleType !== 'car' ? (
                    <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={form.helmetIncluded}
                            onChange={(e) => setForm({ ...form, helmetIncluded: e.target.checked })}
                          />
                        }
                        label="Helmet included"
                      />
                    </Grid>
                  ) : null}
                </Grid>
              </Paper>
              <Paper elevation={0} sx={sectionSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 800, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}
                >
                  Transmission & fuel
                </Typography>
                <Stack spacing={2}>
                  <FormControl component="fieldset" variant="standard">
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 0.5 }}>
                      Transmission
                    </Typography>
                    <RadioGroup
                      row
                      value={form.transmission}
                      onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                      sx={{ flexWrap: 'wrap', gap: 0.5 }}
                    >
                      <FormControlLabel value="Automatic" control={<Radio size="small" />} label="Automatic" />
                      <FormControlLabel value="Manual" control={<Radio size="small" />} label="Manual" />
                    </RadioGroup>
                  </FormControl>
                  <Divider flexItem sx={{ opacity: 0.6 }} />
                  <FormControl component="fieldset" variant="standard">
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 0.5 }}>
                      Fuel
                    </Typography>
                    <RadioGroup
                      row
                      value={form.fuel}
                      onChange={(e) => setForm({ ...form, fuel: e.target.value })}
                      sx={{ flexWrap: 'wrap', gap: 0.5 }}
                    >
                      {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((f) => (
                        <FormControlLabel key={f} value={f} control={<Radio size="small" />} label={f} />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Stack>
              </Paper>
              <Paper elevation={0} sx={sectionSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 800, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}
                >
                  Pickup & compliance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
                  Pickup area defaults to Metro Manila — narrow it to a neighborhood renters recognize.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Odometer"
                      value={form.odometer}
                      onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                      fullWidth
                      required
                      size="small"
                      placeholder="e.g. 42,500 km"
                      error={showIssuesStep1 && form.odometer.trim().length < 1}
                      helperText={showIssuesStep1 && form.odometer.trim().length < 1 ? 'Required for this step' : 'Approximate mileage as shown'}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Pickup area / city"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      fullWidth
                      required
                      size="small"
                      placeholder="e.g. BGC, Taguig"
                      error={showIssuesStep1 && form.location.trim().length < 2}
                      helperText={
                        showIssuesStep1 && form.location.trim().length < 2
                          ? 'Where handover usually happens'
                          : 'Shows on the listing card and map flows'
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Plate number"
                      value={form.plateNumber}
                      onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                      fullWidth
                      required
                      size="small"
                      placeholder="e.g. ABC 1234"
                      error={showIssuesStep1 && form.plateNumber.trim().length < 3}
                      helperText={
                        showIssuesStep1 && form.plateNumber.trim().length < 3
                          ? 'At least 3 characters'
                          : 'Any plate format works in this demo'
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Paper elevation={0} sx={sectionSx}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 800, letterSpacing: '0.12em', display: 'block', mb: 1 }}
                >
                  Amenities
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
                  Tap to toggle. Renters filter on several of these in Browse — skip anything that does not apply.
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                  role="group"
                  aria-label="Included features"
                >
                  {FEATURE_OPTIONS.map((name) => {
                    const on = form.features[name]
                    return (
                      <Chip
                        key={name}
                        label={name}
                        onClick={() => handleFeatureToggle(name)}
                        color={on ? 'primary' : 'default'}
                        variant={on ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: 600,
                          borderRadius: 2,
                          height: 36,
                          '&:focus-visible': {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: 2,
                          },
                        }}
                      />
                    )
                  })}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', lineHeight: 1.5 }}>
                  If none are selected, we default to Bluetooth in the demo catalog.
                </Typography>
              </Paper>
            </Stack>
          )}

          {step === 3 && (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                Review & publish
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 2,
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.background.paper, 1),
                }}
              >
                <Stack spacing={1.5} divider={<Divider flexItem sx={{ opacity: 0.6 }} />}>
                  <Box>
                    <Typography variant="caption" color="primary" fontWeight={700}>
                      {VEHICLE_TYPE_LABELS[form.vehicleType]}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.25 }}>
                      {form.year} {form.make} {form.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {form.type} · {form.seats} seat{form.seats !== 1 ? 's' : ''} · {form.transmission} · {form.fuel}
                      {form.vehicleType !== 'car' && form.engineCapacity.trim() ? ` · ${form.engineCapacity} cc` : ''}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      Daily rate
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={800} sx={{ mt: 0.25 }}>
                      {!Number.isNaN(priceNumeric) ? formatPeso(priceNumeric) : '—'}
                      <Typography component="span" variant="body2" color="text.secondary" fontWeight={600} sx={{ ml: 0.5 }}>
                        / day
                      </Typography>
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {form.description.trim() || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      Pickup & plate
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {form.location.trim() || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Plate {form.plateNumber.trim() || '—'} · Odometer {form.odometer.trim() || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 0.75 }}>
                      Features
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 0.75 }}>
                      {(selectedFeatures.length ? selectedFeatures : ['Bluetooth (default)']).map((f) => (
                        <Chip key={f} label={f} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: 2 }} />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={step === 0 ? requestClose : () => setStep((s) => Math.max(0, s - 1))}
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Box sx={{ flex: '1 1 auto', minWidth: 0, alignSelf: 'center' }}>
            {step === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}>
                Pickup prefills Metro Manila — adjust on the next step.
              </Typography>
            ) : null}
            {step === 1 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}>
                You can tweak photos and calendar after publishing.
              </Typography>
            ) : null}
            {step === 2 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}>
                Optional — tap only what genuinely comes with the vehicle.
              </Typography>
            ) : null}
          </Box>
          {step < 3 ? (
            <Button variant="contained" onClick={goNext} size={isSmDown ? 'large' : 'medium'} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5, ...primaryCtaShadow(theme) }}>
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              size={isSmDown ? 'large' : 'medium'}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5, ...primaryCtaShadow(theme) }}
            >
              {isEditing ? 'Save changes' : 'Publish listing'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

    <Dialog
      open={discardDialogOpen}
      onClose={() => setDiscardDialogOpen(false)}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Discard your changes?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          None of your edits will be saved. You can reopen this anytime and publish when you are ready.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={() => setDiscardDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
          Keep editing
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => {
            setDiscardDialogOpen(false)
            resetAndClose()
          }}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, ...primaryCtaShadow(theme) }}
        >
          Close without saving
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}
