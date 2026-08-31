import { Box, Container, Grid, Paper, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'

import {
  MOBILE_FOOTER_ADDITIONAL_CLEAR_PX,
  MOBILE_TAB_BAR_INSET_PX,
  MOBILE_TAB_BAR_STACK_BOTTOM,
} from '@/components/layout/MobileBottomNav'
import { containerGutters } from '@/theme/pageStyles'
import { rhRadius } from '@/theme/tokens'

const DETAIL_STICKY_RESERVE_PX = 64

/** Detail chrome that matches {@link CarDetailPage} while the catalog hydrates. */
export default function CarDetailSkeleton() {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const titleBlock = (
    <Stack spacing={0.75} sx={{ mt: { xs: 1, md: 2.5 } }}>
      <Skeleton variant="text" animation="wave" width="72%" height={40} />
      <Skeleton variant="text" animation="wave" width="48%" height={20} />
      <Skeleton variant="text" animation="wave" width="36%" height={20} />
      <Skeleton variant="text" animation="wave" width="42%" height={20} />
    </Stack>
  )

  const bookPanel = (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: `${rhRadius.lg}px`,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Skeleton variant="text" animation="wave" width="46%" height={36} />
      <Skeleton variant="rounded" animation="wave" height={56} sx={{ mt: 2, borderRadius: 2 }} />
      <Skeleton variant="rounded" animation="wave" height={56} sx={{ mt: 1.25, borderRadius: 2 }} />
      <Skeleton variant="rounded" animation="wave" height={48} sx={{ mt: 1.5, borderRadius: 2 }} />
      <Skeleton variant="rounded" animation="wave" height={20} sx={{ mt: 2, width: '80%' }} />
      {isMdUp && (
        <>
          <Skeleton variant="rounded" animation="wave" height={48} sx={{ mt: 2.5, borderRadius: 999 }} />
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2.5 }}>
            <Skeleton variant="circular" animation="wave" width={44} height={44} />
            <Stack flex={1} minWidth={0}>
              <Skeleton variant="text" animation="wave" width="55%" />
              <Skeleton variant="text" animation="wave" width="40%" />
            </Stack>
          </Stack>
        </>
      )}
    </Paper>
  )

  const desktopGallery = (
    <Box>
      <Box
        sx={{
          borderRadius: `${rhRadius.lg}px`,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            height: 480,
            gap: '6px',
          }}
        >
          <Skeleton variant="rectangular" animation="wave" sx={{ gridRow: '1 / 3', height: '100%' }} />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" animation="wave" sx={{ height: '100%' }} />
          ))}
        </Box>
      </Box>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" animation="wave" width={96} height={64} sx={{ borderRadius: 2, flexShrink: 0 }} />
        ))}
      </Stack>
    </Box>
  )

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        pb: {
          xs: `calc(${MOBILE_TAB_BAR_INSET_PX + MOBILE_FOOTER_ADDITIONAL_CLEAR_PX + DETAIL_STICKY_RESERVE_PX}px + env(safe-area-inset-bottom, 0px))`,
          md: 10,
        },
      }}
      aria-busy="true"
      aria-label="Loading vehicle"
    >
      {!isMdUp && (
        <>
          <Skeleton variant="rectangular" animation="wave" height={280} sx={{ display: 'block', width: '100%' }} />
          <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ py: 1.25 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" animation="wave" width={i === 0 ? 16 : 6} height={6} sx={{ borderRadius: 999 }} />
            ))}
          </Stack>
        </>
      )}

      <Container maxWidth="lg" sx={{ pt: { xs: 1.5, md: 3 }, ...containerGutters }}>
        <Skeleton
          variant="text"
          animation="wave"
          width={isMdUp ? 220 : 140}
          height={22}
          sx={{ mb: { xs: 1.5, md: 2 } }}
        />

        <Grid container spacing={{ xs: 2.5, md: 4 }}>
          <Grid item xs={12} md={8}>
            {isMdUp && desktopGallery}
            {titleBlock}
            {isMdUp && (
              <Stack spacing={1} sx={{ mt: 3 }}>
                <Skeleton variant="text" animation="wave" width="28%" height={28} />
                <Skeleton variant="text" animation="wave" width="94%" />
                <Skeleton variant="text" animation="wave" width="88%" />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 1 }}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} variant="rounded" animation="wave" height={56} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
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
          elevation={8}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: MOBILE_TAB_BAR_STACK_BOTTOM,
            zIndex: theme.zIndex.appBar - 1,
            borderRadius: `${rhRadius.lg}px ${rhRadius.lg}px 0 0`,
            px: 2,
            pt: 1.25,
            pb: 1.25,
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
