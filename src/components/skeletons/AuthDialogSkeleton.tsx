import { Box, Paper, Skeleton, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'

/** Dialog-sized fallback while the auth chunk loads. */
export default function AuthDialogSkeleton() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (t) => alpha(t.palette.background.default, 0.72),
        px: 2,
      }}
      aria-busy="true"
      aria-label="Loading sign-in"
    >
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          p: { xs: 2.5, sm: 3 },
        }}
      >
        <Stack spacing={2}>
          <Skeleton variant="rounded" animation="wave" height={40} sx={{ borderRadius: 999 }} />
          <Skeleton variant="text" animation="wave" width="48%" height={28} />
          <Skeleton variant="rounded" animation="wave" height={52} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" animation="wave" height={52} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" animation="wave" height={48} sx={{ borderRadius: 2 }} />
        </Stack>
      </Paper>
    </Box>
  )
}
