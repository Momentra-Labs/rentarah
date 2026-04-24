import LocationSearching from '@mui/icons-material/LocationSearching'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useRef } from 'react'

import { useGeolocationStore } from '../../store/useGeolocationStore'

export default function GeolocationShareDialog() {
  const open = useGeolocationStore((s) => s.geoDialogOpen)
  const closeGeoDialog = useGeolocationStore((s) => s.closeGeoDialog)
  const userLocation = useGeolocationStore((s) => s.userLocation)
  const status = useGeolocationStore((s) => s.status)
  const requestLocation = useGeolocationStore((s) => s.requestLocation)
  const clearLocation = useGeolocationStore((s) => s.clearLocation)

  const pending = status === 'pending'
  const denied = status === 'denied'
  const unsupported = status === 'unsupported'
  const ready = status === 'ready' && Boolean(userLocation)

  /** Capture before Modal mutates `body`; re-apply after enter/exit so the page doesn’t jump to the top. */
  const savedScrollYRef = useRef(0)

  const restoreScroll = () => {
    const y = savedScrollYRef.current
    const restore = () => window.scrollTo({ top: y, behavior: 'auto' })
    restore()
    requestAnimationFrame(() => {
      restore()
      requestAnimationFrame(restore)
    })
  }

  return (
    <Dialog
      open={open}
      onClose={closeGeoDialog}
      maxWidth="xs"
      fullWidth
      aria-labelledby="geo-share-title"
      disableRestoreFocus
      TransitionProps={{
        onEnter: () => {
          savedScrollYRef.current = window.scrollY
        },
        onEntered: restoreScroll,
        onExited: restoreScroll,
      }}
    >
      <DialogTitle id="geo-share-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        <LocationSearching color="primary" />
        Location for Rentara
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            When you choose to share your location, we use it only in this browser to show distance and driving routes to
            pickup points on vehicle pages. We never send it to our servers in this demo.
          </Typography>
          {unsupported && (
            <Alert severity="warning">This browser does not support location services.</Alert>
          )}
          {denied && (
            <Alert severity="error">
              Location was blocked. Check your browser site settings for this page, then try again.
            </Alert>
          )}
          {ready && (
            <Alert severity="success">
              Location is on. You can update your position or turn it off below.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        {ready ? (
          <>
            <Button onClick={clearLocation} color="inherit">
              Turn off
            </Button>
            <Button
              onClick={requestLocation}
              variant="outlined"
              disabled={pending}
              startIcon={pending ? <CircularProgress size={16} /> : <LocationSearching />}
            >
              Update location
            </Button>
            <Button onClick={closeGeoDialog} variant="contained" sx={{ bgcolor: '#1A56DB' }}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button onClick={closeGeoDialog} color="inherit">
              Not now
            </Button>
            <Button
              onClick={requestLocation}
              variant="contained"
              disabled={pending || unsupported}
              sx={{ bgcolor: '#1A56DB' }}
              startIcon={pending ? <CircularProgress size={18} color="inherit" /> : <LocationSearching />}
            >
              {pending ? 'Waiting…' : 'Share my location'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
