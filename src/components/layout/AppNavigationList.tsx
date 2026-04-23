import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import ElectricMopedOutlined from '@mui/icons-material/ElectricMopedOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import LoginOutlined from '@mui/icons-material/LoginOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import LuggageOutlined from '@mui/icons-material/LuggageOutlined'
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import SportsMotorsportsOutlined from '@mui/icons-material/SportsMotorsportsOutlined'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import TwoWheelerOutlined from '@mui/icons-material/TwoWheelerOutlined'
import { alpha, Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import RentaraLogoMark from '../brand/RentaraLogoMark'
import { useAuthStore } from '../../store/useAuthStore'
import type { VehicleType } from '../../types'
import { resolveNavItemSelected } from './navSelection'

type ItemKind = 'link' | 'auth' | 'logout'

export type NavRow = {
  key: string
  label: string
  kind: ItemKind
  to?: string
  icon: ReactNode
}

const VEHICLE_QUICK_FILTER: { key: string; label: string; vt: VehicleType; icon: ReactNode }[] = [
  { key: 'v-car', label: 'Cars', vt: 'car', icon: <DirectionsCarOutlined fontSize="small" /> },
  { key: 'v-moto', label: 'Motorcycles', vt: 'motorcycle', icon: <TwoWheelerOutlined fontSize="small" /> },
  { key: 'v-sco', label: 'Scooters', vt: 'scooter', icon: <ElectricMopedOutlined fontSize="small" /> },
  { key: 'v-bb', label: 'Big bikes', vt: 'bigbike', icon: <SportsMotorsportsOutlined fontSize="small" /> },
]

function getVtParam(search: string) {
  return new URLSearchParams(search).get('vt')
}

const EXPLORE_NAV_BASE: NavRow[] = [
  {
    key: 'browse',
    label: 'Browse vehicles',
    kind: 'link',
    to: '/search',
    icon: <SearchOutlined fontSize="small" />,
  },
  {
    key: 'home',
    label: 'Home',
    kind: 'link',
    to: '/',
    icon: <HomeOutlined fontSize="small" />,
  },
]

const LIST_VEHICLE_ROW: NavRow = {
  key: 'list',
  label: 'List a vehicle',
  kind: 'link',
  to: '/host?section=list',
  icon: <DirectionsCarOutlined fontSize="small" />,
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography
      component="div"
      variant="caption"
      sx={{
        px: 2,
        pt: 2,
        pb: 1,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'text.secondary',
      }}
    >
      {children}
    </Typography>
  )
}

function navItemSx(theme: Theme, selected: boolean) {
  const base = {
    mx: 1,
    borderRadius: 2,
    py: 1.15,
    pr: 1.5,
    pl: 1.25,
    mb: 0.25,
    minHeight: 48,
    transition: 'background-color 0.18s ease, color 0.18s ease, transform 0.15s ease',
    '&:hover': {
      bgcolor: alpha(theme.palette.primary.main, 0.06),
      transform: 'translateX(2px)',
    },
  } as const
  if (selected) {
    return {
      ...base,
      bgcolor: alpha(theme.palette.primary.main, 0.12),
      color: theme.palette.primary.main,
      fontWeight: 700,
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, 0.16),
        transform: 'none',
      },
      '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
    }
  }
  return {
    ...base,
    '& .MuiListItemIcon-root': { color: theme.palette.text.secondary },
  }
}

export type AppNavigationListProps = {
  onNavigate?: () => void
  onAuthOpen?: () => void
  onLogout?: () => void
}

export default function AppNavigationList({ onNavigate, onAuthOpen, onLogout }: AppNavigationListProps) {
  const location = useLocation()
  const pathname = location.pathname
  const hash = location.hash
  const search = location.search
  const user = useAuthStore((s) => s.user)

  const exploreNav: NavRow[] = [...EXPLORE_NAV_BASE, ...(user ? [LIST_VEHICLE_ROW] : [])]

  const accountLinks: NavRow[] = user
    ? [
        ...(!user.isHost
          ? [
              {
                key: 'become-host',
                label: 'Become a Host',
                kind: 'link' as const,
                to: '/host',
                icon: <StorefrontOutlined fontSize="small" />,
              },
            ]
          : []),
        {
          key: 'my-trips',
          label: 'My Trips',
          kind: 'link',
          to: '/dashboard?nav=trips',
          icon: <LuggageOutlined fontSize="small" />,
        },
        {
          key: 'notifications',
          label: 'Notifications',
          kind: 'link',
          to: '/notifications',
          icon: <NotificationsOutlined fontSize="small" />,
        },
        {
          key: 'dashboard',
          label: 'Dashboard',
          kind: 'link',
          to: '/dashboard',
          icon: <EventNoteOutlined fontSize="small" />,
        },
        {
          key: 'host-dash',
          label: 'Host dashboard',
          kind: 'link',
          to: '/host',
          icon: <StorefrontOutlined fontSize="small" />,
        },
      ]
    : []

  const renderRow = (row: NavRow) => {
    const selected = resolveNavItemSelected(row.key, pathname, hash, search, user)

    if (row.kind === 'auth') {
      return (
        <ListItemButton
          key={row.key}
          onClick={() => {
            onAuthOpen?.()
            onNavigate?.()
          }}
          sx={(theme) => navItemSx(theme, false)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{row.icon}</ListItemIcon>
          <ListItemText primary={row.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
        </ListItemButton>
      )
    }

    if (row.kind === 'logout') {
      return (
        <ListItemButton
          key={row.key}
          onClick={() => {
            onLogout?.()
            onNavigate?.()
          }}
          sx={(theme) => navItemSx(theme, false)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{row.icon}</ListItemIcon>
          <ListItemText primary={row.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
        </ListItemButton>
      )
    }

    return (
      <ListItemButton
        key={row.key}
        component={RouterLink}
        to={row.to!}
        selected={selected}
        onClick={() => onNavigate?.()}
        sx={(theme) => navItemSx(theme, selected)}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>{row.icon}</ListItemIcon>
        <ListItemText primary={row.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: '0.9375rem' }} />
      </ListItemButton>
    )
  }

  return (
    <List component="nav" disablePadding sx={{ py: 1 }}>
      <SectionLabel>Explore</SectionLabel>
      {exploreNav.map(renderRow)}

      <SectionLabel>Vehicles</SectionLabel>
      {VEHICLE_QUICK_FILTER.map((row) => {
        const selected = pathname.startsWith('/search') && getVtParam(search) === row.vt
        return (
          <ListItemButton
            key={row.key}
            component={RouterLink}
            to={`/search?vt=${row.vt}`}
            selected={selected}
            onClick={() => onNavigate?.()}
            sx={(theme) => navItemSx(theme, selected)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{row.icon}</ListItemIcon>
            <ListItemText
              primary={row.label}
              primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: '0.9375rem' }}
            />
          </ListItemButton>
        )
      })}

      {user ? (
        <>
          <SectionLabel>Your account</SectionLabel>
          {accountLinks.map(renderRow)}
          <ListItemButton
            onClick={() => {
              onLogout?.()
              onNavigate?.()
            }}
            sx={(theme) => navItemSx(theme, false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
          </ListItemButton>
        </>
      ) : (
        <>
          <SectionLabel>Access</SectionLabel>
          <ListItemButton
            onClick={() => {
              onAuthOpen?.()
              onNavigate?.()
            }}
            sx={(theme) => navItemSx(theme, false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LoginOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign In" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              onAuthOpen?.()
              onNavigate?.()
            }}
            sx={(theme) => navItemSx(theme, false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PersonAddOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Get Started" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
          </ListItemButton>
        </>
      )}
    </List>
  )
}

/** Desktop persistent rail */
export function AppNavSidebar({ onAuthOpen, onLogout }: { onAuthOpen: () => void; onLogout: () => void }) {
  return (
    <Box
      component="aside"
      aria-label="Main navigation"
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        width: 268,
        flexShrink: 0,
        alignSelf: 'stretch',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component={RouterLink}
        to="/"
        className="rentara-brand-lockup"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          // Match main `Toolbar` so the brand row lines up with the app bar across the divider
          px: { xs: 2, md: 2.5 },
          py: 0,
          minHeight: { md: 64 },
          boxSizing: 'border-box',
          textDecoration: 'none',
          color: 'inherit',
          borderBottom: 1,
          borderColor: 'divider',
          transition: 'background-color 0.2s ease, transform 0.22s ease-in-out',
          '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
          '@media (hover: hover)': {
            '&:hover': { transform: 'scale(1.02)' },
          },
        }}
      >
        <RentaraLogoMark size="md" showTextFallback={false} />
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            display: 'block',
            fontSize: { md: '1.1875rem' },
          }}
        >
          Rentara
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
        <AppNavigationList onAuthOpen={onAuthOpen} onLogout={onLogout} />
      </Box>
    </Box>
  )
}
