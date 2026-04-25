import Close from '@mui/icons-material/Close'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { DEFAULT_SEARCH_LOCATION } from '../../constants/geo'
import type { Car, VehicleType } from '../../types'
import { useAuthStore } from '../../store/useAuthStore'
import { useCarsStore } from '../../store/useCarsStore'
import { useSnackbarStore } from '../../store/useSnackbarStore'
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_VALUES } from '../../utils/vehicleUtils'

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
  location: '',
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
  const isEditing = Boolean(editingCarId)

  useEffect(() => {
    if (!open) {
      setInitialSnapshot(null)
      setDiscardDialogOpen(false)
      return
    }
    if (editingCarId) {
      const car = getCarById(editingCarId)
      if (car) {
        const next = carToForm(car)
        setForm(next)
        setStep(0)
        setInitialSnapshot(next)
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
    if (Number.isNaN(price) || price < 0) return

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
      description: form.description.trim() || 'Hosted on Rentara.',
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
    form.make.trim().length >= 2 &&
    form.model.trim().length >= 1 &&
    form.pricePerDay !== '' &&
    form.description.trim().length >= 10

  const canNextStep1 =
    form.odometer.trim().length >= 1 &&
    form.location.trim().length >= 2 &&
    form.plateNumber.trim().length >= 3

  const goNext = () => {
    if (step === 0 && !canNextStep0) return
    if (step === 1 && !canNextStep1) return
    setStep((s) => Math.min(3, s + 1))
  }

  const handleFeatureToggle = (key: string) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }))
  }

  return (
    <>
    <Dialog
      open={open}
      onClose={handleMainDialogClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      disableRestoreFocus
    >
      <DialogTitle
        sx={{
          pr: 5,
          pt: 2,
          pb: 1.5,
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
        <Stack spacing={0.5} alignItems="flex-start" component="div">
          <Typography component="span" variant="h6" sx={{ pr: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {isEditing ? 'Edit listing' : 'List a new vehicle'} — step {step + 1} of 4
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ pr: 2, lineHeight: 1.4 }}>
            If you close this window before saving, your changes will not be kept.
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {step === 0 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="list-vehicle-type">Vehicle type</InputLabel>
              <Select
                labelId="list-vehicle-type"
                label="Vehicle type"
                value={form.vehicleType}
                onChange={(e) => {
                  const vehicleType = e.target.value as VehicleType
                  setForm((f) => ({
                    ...f,
                    vehicleType,
                    seats: vehicleType === 'car' ? 5 : 2,
                    type: vehicleType === 'car' ? f.type : TWO_WHEELER_BODY_TYPES[0],
                  }))
                }}
              >
                {VEHICLE_TYPE_VALUES.map((v) => (
                  <MenuItem key={v} value={v}>
                    {VEHICLE_TYPE_LABELS[v]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Make"
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Year"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Body / segment</InputLabel>
              <Select
                label="Body / segment"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {(form.vehicleType === 'car' ? CAR_TYPES : TWO_WHEELER_BODY_TYPES).map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Price per day (₱)"
              type="number"
              value={form.pricePerDay}
              onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              required
              multiline
              minRows={3}
            />
          </Stack>
        )}

        {step === 1 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {form.vehicleType !== 'car' && (
              <TextField
                label="Engine capacity (cc)"
                value={form.engineCapacity}
                onChange={(e) => setForm({ ...form, engineCapacity: e.target.value.replace(/\D/g, '') })}
                fullWidth
                inputProps={{ inputMode: 'numeric' }}
                helperText="Optional — a default is used if left empty on submit"
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Seats</InputLabel>
              <Select
                label="Seats"
                value={String(form.seats)}
                onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
              >
                {(form.vehicleType === 'car' ? [2, 4, 5, 7] : [1, 2]).map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {form.vehicleType !== 'car' && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.helmetIncluded}
                    onChange={(e) => setForm({ ...form, helmetIncluded: e.target.checked })}
                  />
                }
                label="Helmet included with rental"
              />
            )}
            <FormControl>
              <Typography variant="subtitle2" gutterBottom>
                Transmission
              </Typography>
              <RadioGroup
                row
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
              >
                <FormControlLabel value="Automatic" control={<Radio />} label="Automatic" />
                <FormControlLabel value="Manual" control={<Radio />} label="Manual" />
              </RadioGroup>
            </FormControl>
            <FormControl>
              <Typography variant="subtitle2" gutterBottom>
                Fuel
              </Typography>
              <RadioGroup row value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value })}>
                {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((f) => (
                  <FormControlLabel key={f} value={f} control={<Radio />} label={f} />
                ))}
              </RadioGroup>
            </FormControl>
            <TextField label="Odometer" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} fullWidth />
            <TextField label="Pickup location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} fullWidth />
            <TextField label="Plate number" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} fullWidth />
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Included features</Typography>
            <FormGroup>
              {FEATURE_OPTIONS.map((name) => (
                <FormControlLabel
                  key={name}
                  control={<Checkbox checked={form.features[name]} onChange={() => handleFeatureToggle(name)} />}
                  label={name}
                />
              ))}
            </FormGroup>
          </Stack>
        )}

        {step === 3 && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="h6">Review</Typography>
            <Typography>
              {VEHICLE_TYPE_LABELS[form.vehicleType]} · {form.year} {form.make} {form.model} · {form.type}
            </Typography>
            <Typography color="text.secondary">{form.description}</Typography>
            <Typography>
              ₱{form.pricePerDay}/day · {form.seats} seat{form.seats !== 1 ? 's' : ''} · {form.transmission} · {form.fuel}
              {form.vehicleType !== 'car' && form.engineCapacity.trim() && ` · ${form.engineCapacity} cc`}
            </Typography>
            <Typography variant="body2">{form.location}</Typography>
            <Typography variant="body2">Plate: {form.plateNumber}</Typography>
            <Typography variant="body2">Features: {selectedFeatures.join(', ') || '—'}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={step === 0 ? requestClose : () => setStep((s) => s - 1)}>{step === 0 ? 'Cancel' : 'Back'}</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {step < 3 ? (
          <Button variant="contained" onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit}>
            {isEditing ? 'Save changes' : 'List my vehicle'}
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
    >
      <DialogTitle>Discard your changes?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          None of your edits will be saved. You can return and save when you are ready.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={() => setDiscardDialogOpen(false)}>Keep editing</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => {
            setDiscardDialogOpen(false)
            resetAndClose()
          }}
        >
          Close without saving
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}
