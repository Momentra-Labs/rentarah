import { Alert, Snackbar } from '@mui/material'

import { useSnackbarStore } from '../../store/useSnackbarStore'

export default function GlobalSnackbar() {
  const open = useSnackbarStore((s) => s.open)
  const message = useSnackbarStore((s) => s.message)
  const severity = useSnackbarStore((s) => s.severity)
  const close = useSnackbarStore((s) => s.close)

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={close}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 'max(16px, env(safe-area-inset-bottom))', sm: 24 } }}
    >
      <Alert severity={severity} variant="filled" onClose={close} sx={{ width: '100%', maxWidth: { xs: 'calc(100vw - 32px)', sm: 480 } }}>
        {message}
      </Alert>
    </Snackbar>
  )
}
