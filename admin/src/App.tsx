import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined'
import {
  Alert,
  Box,
  Button,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Route, Routes } from 'react-router-dom'

import AdminShell from './components/AdminShell'
import { adminDrawerWidth } from './components/adminNav'
import { AdminDataProvider } from './context/AdminDataContext'
import BookingsPage from './pages/BookingsPage'
import DashboardPage from './pages/DashboardPage'
import ListingsPage from './pages/ListingsPage'
import NotFoundPage from './pages/NotFoundPage'
import VerificationPage from './pages/VerificationPage'

const drawerItems = [
  { label: 'Overview', path: '/', icon: <SpaceDashboardOutlined /> },
  { label: 'Listings', path: '/listings', icon: <DirectionsCarOutlined /> },
  { label: 'Bookings', path: '/bookings', icon: <EventNoteOutlined /> },
  { label: 'ID verification', path: '/verification', icon: <BadgeOutlined /> },
]

function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminShell drawerItems={drawerItems} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AdminDataProvider>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            background: `linear-gradient(180deg, ${alpha('#0F172A', 0.995)} 0%, ${alpha('#151F3A', 0.98)} 100%)`,
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid',
            borderColor: alpha('#fff', 0.08),
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            boxShadow: '0 8px 28px rgba(2, 6, 23, 0.45)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={{ xs: 1.25, sm: 2 }} sx={{ flexWrap: 'wrap', columnGap: 1.5 }}>
              <Typography
                variant="h6"
                sx={{
                  color: '#F8FAFC',
                  letterSpacing: '-0.03em',
                  fontWeight: 800,
                  fontFamily: `"Urbanist", "Inter", sans-serif`,
                  fontSize: { xs: '1.05rem', sm: '1.26rem' },
                }}
              >
                RentaraH Admin
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 999,
                  bgcolor: alpha('#fff', 0.08),
                  border: `1px solid ${alpha('#fff', 0.1)}`,
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: alpha('#FB923C', 0.95) }} aria-hidden />
                <Typography component="span" variant="caption" sx={{ color: alpha('#F8FAFC', 0.76), fontWeight: 650 }}>
                  No auth wired
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="text"
              href="https://vitejs.dev/guide/static-deploy.html"
              target="_blank"
              rel="noreferrer"
              size="medium"
              sx={{
                flexShrink: 0,
                color: alpha('#F8FAFC', 0.88),
                display: { xs: 'none', sm: 'inline-flex' },
                fontWeight: 700,
              }}
            >
              Deploy guide
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pt: 2.25,
            pb: { xs: 2, md: 2 },
            mx: 'auto',
            width: '100%',
            maxWidth: { md: `${adminDrawerWidth + 1180 + 48}px` },
          }}
        >
          <Alert
            severity="warning"
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              alignItems: 'flex-start',
              bgcolor: alpha('#FFFBEB', 0.9),
              borderColor: alpha('#F59E0B', 0.45),
              '& .MuiAlert-icon': { color: 'warning.dark' },
              boxShadow: '0 10px 32px rgba(245,158,11,0.06)',
            }}
          >
            <Typography variant="body2" component="div" sx={{ fontWeight: 550, color: '#78350f' }}>
              Restrict this console behind Firebase admin claims / your API before deploying it publicly — the UI assumes a trusted viewer.
            </Typography>
          </Alert>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <AdminRoutes />
        </Box>

        <Box
          component="footer"
          sx={{
            mt: 'auto',
            px: { xs: 2, md: 3 },
            py: { xs: 2.75, md: 3 },
            pl: { md: `${24 + adminDrawerWidth}px` },
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha('#FFFFFF', 0.82),
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="caption" color="text.secondary" component="div" sx={{ maxWidth: 920, lineHeight: 1.6 }}>
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary', mr: 0.5 }}>
              Catalog
            </Box>
            use{' '}
            <Box component="span" sx={{ fontFamily: 'monospace' }}>
              VITE_RENTARA_API_URL
            </Box>{' '}
            or{' '}
            <Box component="span" sx={{ fontFamily: 'monospace' }}>
              VITE_API_URL
            </Box>{' '}
            → <Box component="span" sx={{ fontFamily: 'monospace' }}>/vehicles</Box>. Toggles:&nbsp;
            <Box component="span" sx={{ fontFamily: 'monospace' }}>
              sessionStorage
            </Box>
            . Listing links:&nbsp;
            <Box component="span" sx={{ fontFamily: 'monospace' }}>
              VITE_MARKETPLACE_ORIGIN
            </Box>
            .{' '}
            <Link href="https://vitejs.dev/guide/env-and-mode.html" target="_blank" rel="noreferrer">
              Env &amp; mode
            </Link>
          </Typography>
        </Box>
      </Box>
    </AdminDataProvider>
  )
}
