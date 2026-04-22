import { Alert, Snackbar } from '@mui/material'

import { useSnackbarStore } from '../../store/useSnackbarStore'

export default function GlobalSnackbar() {
  const open = useSnackbarStore((s) => s.open)
  const message = useSnackbarStore((s) => s.message)
  const severity = useSnackbarStore((s) => s.severity)
  const close = useSnackbarStore((s) => s.close)

  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={close} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity={severity} variant="filled" onClose={close} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}
