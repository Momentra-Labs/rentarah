import HourglassBottomRounded from '@mui/icons-material/HourglassBottomRounded'
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import TwoWheeler from '@mui/icons-material/TwoWheeler'
import DirectionsCarRounded from '@mui/icons-material/DirectionsCarRounded'
import VerifiedRounded from '@mui/icons-material/VerifiedRounded'
import {
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { useAdminData } from '../context/AdminDataContext'
import { formatPeso } from '../lib/formatPeso'
import { marketplaceCarUrl } from '../lib/marketplaceUrl'
import { adminTableHeadRowSx, adminTablePaperSx, adminTableStripeSx } from '../theme/tableSx'

function bookingStatusChipSx(status: string) {
  switch (status) {
    case 'cancelled':
      return { border: `1px solid ${alpha('#94a3b8', 0.45)}`, bgcolor: alpha('#f1f5f9', 0.9), color: 'text.secondary' }
    case 'pending':
      return { border: `1px solid ${alpha('#f59e0b', 0.45)}`, bgcolor: alpha('#fffbeb', 0.95), color: 'warning.dark' }
    default:
      return { border: `1px solid ${alpha('#059669', 0.42)}`, bgcolor: alpha('#ecfdf5', 0.76), color: 'success.dark' }
  }
}

export default function DashboardPage() {
  const {
    vehiclesDisplay,
    catalogSource,
    catalogNote,
    catalogLoading,
    refreshCatalog,
    bookings,
    verificationQueue,
  } = useAdminData()

  const fleetTwoWheel = useMemo(() => vehiclesDisplay.filter((v) => v.vehicleType !== 'car').length, [vehiclesDisplay])
  const liveListings = useMemo(() => vehiclesDisplay.filter((v) => v.available).length, [vehiclesDisplay])
  const pendingId = verificationQueue.filter((r) => r.status === 'pending_review').length
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length
  const pausedListings = vehiclesDisplay.length - liveListings

  const recentBookings = useMemo(() => [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [bookings])

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <PageHeader
        eyebrow="Today"
        title="Marketplace overview"
        description={
          <Stack spacing={1.25}>
            <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" useFlexGap>
              <Chip
                size="small"
                color={catalogSource === 'api' ? 'success' : 'default'}
                label={catalogSource === 'api' ? 'Catalog from API' : 'Demo catalog fallback'}
                sx={{ fontWeight: 700 }}
              />
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, my: '4px!important' }} />
              <span>Bookings and verification queues are in-memory previews until wired to Postgres / Firestore.</span>
            </Stack>
          </Stack>
        }
        actions={
          <Button variant="outlined" startIcon={<RefreshRounded />} onClick={() => void refreshCatalog()} disabled={catalogLoading}>
            Refresh catalog
          </Button>
        }
      />

      {catalogLoading ? <LinearProgress sx={{ borderRadius: 999, height: 4 }} /> : null}

      <Stack spacing={3}>
        {catalogNote ? (
          <Paper
            variant="outlined"
            sx={{
              px: 2,
              py: 1.75,
              borderRadius: 2.5,
              bgcolor: alpha('#FFFBEB', 0.75),
              borderColor: alpha('#F59E0B', 0.35),
            }}
          >
            <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
              Using demo catalog:{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                {catalogNote}
              </Box>
            </Box>
          </Paper>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 2.25 },
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          }}
        >
          <StatCard
            label="Live listings"
            value={liveListings}
            hint={`${pausedListings} paused or hidden`}
            icon={<DirectionsCarRounded />}
          />
          <StatCard
            label="Two-wheel fleet"
            value={fleetTwoWheel}
            hint="Cycles in catalog (motorcycle / scooter / big bike)"
            icon={<TwoWheeler />}
          />
          <StatCard
            label="Pending bookings"
            value={pendingBookings}
            hint="Awaiting confirmations in the demo workbook"
            icon={<HourglassBottomRounded />}
          />
          <StatCard label="ID queue" value={pendingId} hint="Licenses awaiting review" icon={<VerifiedRounded />} />
        </Box>

        <Paper
          sx={{
            p: { xs: 2, sm: 2.25 },
            borderRadius: 2.5,
            border: '1px dashed',
            borderColor: alpha('#1a56db', 0.2),
            bgcolor: alpha('#fff', 0.55),
          }}
          elevation={0}
        >
          <Stack spacing={1}>
            <Box sx={{ typography: 'caption', fontWeight: 750, letterSpacing: '0.055em', textTransform: 'uppercase', color: 'primary.main' }}>
              Shortcuts
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="text" component={RouterLink} to="/listings" sx={{ fontWeight: 700 }}>
                Listings workspace
              </Button>
              <Button variant="text" component={RouterLink} to="/bookings" sx={{ fontWeight: 700 }}>
                Bookings ledger
              </Button>
              <Button variant="text" component={RouterLink} to="/verification" sx={{ fontWeight: 700 }}>
                ID verification queue
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ ...adminTablePaperSx, borderRadius: 2.75 }}>
          <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.25, pb: 1 }}>
            <Box sx={{ typography: 'subtitle1', fontWeight: 750, mb: 0.25 }}>Recent bookings</Box>
            <Box sx={{ typography: 'body2', color: 'text.secondary' }}>Pulls newest rows — link out to marketplace detail screens.</Box>
          </Box>
          <Divider />
          <Box sx={{ px: { xs: 0, sm: 0 }, ...adminTableStripeSx }}>
            <Table size="small">
              <TableHead sx={adminTableHeadRowSx}>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Guest</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Trip</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Listing</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentBookings.map((b) => (
                  <TableRow key={b.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 680 }}>{b.ref}</TableCell>
                    <TableCell>{b.renterName ?? b.userId}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary', fontSize: '0.8125rem' }}>
                      {b.pickup} → {b.dropoff}
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatPeso(b.total)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={b.status}
                        sx={{ fontWeight: 700, textTransform: 'capitalize', ...bookingStatusChipSx(b.status) }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        endIcon={<OpenInNewRounded sx={{ fontSize: 16 }} />}
                        href={marketplaceCarUrl(b.carId)}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ fontWeight: 700 }}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Stack>
    </Stack>
  )
}
