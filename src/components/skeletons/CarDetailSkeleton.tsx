import { Box, Container, Grid, Paper, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'

import { MOBILE_FOOTER_ADDITIONAL_CLEAR_PX, MOBILE_TAB_BAR_INSET_PX } from '@/components/layout/MobileBottomNav'
import { containerGutters } from '@/theme/pageStyles'

/** Detail chrome that matches {@link CarDetailPage} while the catalog hydrates. */
export default function CarDetailSkeleton() {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const thumbs = (
    <Stack direction="row" spacing={1} sx={{ mt: { xs: 0, md: 2 }, px: { xs: 2, md: 0 }, pt: { xs: 1.5, md: 0 } }}>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton
          key={i}
          variant="rounded"
          animation="wave"
          width={isMdUp ? 96 : 64}
          height={isMdUp ? 64 : 48}
          sx={{ flexShrink: 0, borderRadius: 2 }}
        />
      ))}
    </Stack>
  )

  const titleBlock = (
    <Stack spacing={1} sx={{ mt: { xs: 1, md: 2 } }}>
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rounded" animation="wave" width={72} height={24} sx={{ borderRadius: 999 }} />
        <Skeleton variant="rounded" animation="wave" width={88} height={24} sx={{ borderRadius: 999 }} />
      </Stack>
      <Skeleton variant="text" animation="wave" width="70%" height={40} />
      <Skeleton variant="text" animation="wave" width="38%" height={22} />
      <Skeleton variant="text" animation="wave" width="48%" height={20} />
    </Stack>
  )

  const bookPanel = (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Skeleton variant="text" animation="wave" width="46%" height={36} />
      <Skeleton variant="rounded" animation="wave" height={56} sx={{ mt: 2, borderRadius: 2 }} />
      <Skeleton variant="rounded" animation="wave" height={56} sx={{ mt: 1.25, borderRadius: 2 }} />
      <Skeleton variant="rounded" animation="wave" height={20} sx={{ mt: 2, width: '80%' }} />
      <Skeleton variant="rounded" animation="wave" height={20} sx={{ mt: 1, width: '64%' }} />
      {isMdUp && (
        <Skeleton variant="rounded" animation="wave" height={48} sx={{ mt: 2.5, borderRadius: 999 }} />
      )}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2.5 }}>
        <Skeleton variant="circular" animation="wave" width={44} height={44} />
        <Stack flex={1} minWidth={0}>
          <Skeleton variant="text" animation="wave" width="55%" />
          <Skeleton variant="text" animation="wave" width="40%" />
        </Stack>
      </Stack>
    </Paper>
  )

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        pb: { xs: `calc(${MOBILE_TAB_BAR_INSET_PX + MOBILE_FOOTER_ADDITIONAL_CLEAR_PX}px + env(safe-area-inset-bottom, 0px))`, md: 10 },
      }}
      aria-busy="true"
      aria-label="Loading vehicle"
    >
      {!isMdUp && (
        <>
          <Skeleton variant="rectangular" animation="wave" height={280} sx={{ display: 'block', width: '100%' }} />
          {thumbs}
        </>
      )}

      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, ...containerGutters }}>
        <Skeleton
          variant="text"
          animation="wave"
          width={isMdUp ? 220 : 140}
          height={22}
          sx={{ mb: { xs: 1.5, md: 2 } }}
        />

        <Grid container spacing={{ xs: 2.5, md: 4 }}>
          <Grid item xs={12} md={8}>
            {isMdUp && (
              <>
                <Skeleton
                  variant="rounded"
                  animation="wave"
                  height={480}
                  sx={{ borderRadius: 3, display: 'block' }}
                />
                {thumbs}
              </>
            )}
            {titleBlock}
            {isMdUp && (
              <Stack spacing={1} sx={{ mt: 3 }}>
                <Skeleton variant="text" animation="wave" width="28%" height={28} />
                <Skeleton variant="text" animation="wave" width="94%" />
                <Skeleton variant="text" animation="wave" width="88%" />
                <Skeleton variant="text" animation="wave" width="72%" />
              </Stack>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            {bookPanel}
            {isMdUp && (
              <Paper
                elevation={0}
                sx={{ mt: 2, p: 2.25, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
              >
                <Skeleton variant="text" animation="wave" width="46%" height={24} sx={{ mb: 1 }} />
                {[0, 1, 2].map((i) => (
                  <Stack key={i} direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.75 }}>
                    <Skeleton variant="rounded" animation="wave" width={64} height={48} sx={{ borderRadius: 1.5 }} />
                    <Stack flex={1} minWidth={0}>
                      <Skeleton variant="text" animation="wave" width="70%" />
                      <Skeleton variant="text" animation="wave" width="50%" />
                    </Stack>
                  </Stack>
                ))}
              </Paper>
            )}
          </Grid>
          {!isMdUp && (
            <Grid item xs={12}>
              <Skeleton variant="text" animation="wave" width="36%" height={28} />
              <Skeleton variant="text" animation="wave" width="94%" />
              <Skeleton variant="text" animation="wave" width="86%" />
            </Grid>
          )}
        </Grid>
      </Container>

      {!isMdUp && (
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar,
            borderRadius: '16px 16px 0 0',
            px: 2,
            pt: 1.5,
            pb: `calc(12px + ${MOBILE_TAB_BAR_INSET_PX}px + env(safe-area-inset-bottom, 0px))`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" animation="wave" width={48} height={14} />
            <Skeleton variant="text" animation="wave" width={96} height={24} />
          </Box>
          <Skeleton variant="rounded" animation="wave" width={132} height={44} sx={{ borderRadius: 999 }} />
        </Paper>
      )}
    </Box>
  )
}
