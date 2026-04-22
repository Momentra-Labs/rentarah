import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import LoginOutlined from '@mui/icons-material/LoginOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import LuggageOutlined from '@mui/icons-material/LuggageOutlined'
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import { alpha, Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import { useAuthStore } from '../../store/useAuthStore'

type ItemKind = 'link' | 'auth' | 'logout'

export type NavRow = {
  key: string
  label: string
  kind: ItemKind
  to?: string
  icon: ReactNode
  match: (pathname: string, hash: string) => boolean
}

const MAIN_NAV: NavRow[] = [
  {
    key: 'browse',
    label: 'Browse Cars',
    kind: 'link',
    to: '/search',
    icon: <SearchOutlined fontSize="small" />,
    match: (p) => p === '/search' || p.startsWith('/search'),
  },
  {
    key: 'how',
    label: 'How it Works',
    kind: 'link',
    to: '/#how',
    icon: <HelpOutlineOutlined fontSize="small" />,
    match: (_p, h) => h === '#how',
  },
  {
    key: 'list',
    label: 'List Your Car',
    kind: 'link',
    to: '/host',
    icon: <DirectionsCarOutlined fontSize="small" />,
    match: (p) => p === '/host' || p.startsWith('/host'),
  },
]

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
  const user = useAuthStore((s) => s.user)

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
                match: (p: string) => p === '/host' || p.startsWith('/host'),
              },
            ]
          : []),
        {
          key: 'my-trips',
          label: 'My Trips',
          kind: 'link',
          to: '/dashboard',
          icon: <LuggageOutlined fontSize="small" />,
          match: (p) => p === '/dashboard' || p.startsWith('/dashboard'),
        },
        {
          key: 'dashboard',
          label: 'Dashboard',
          kind: 'link',
          to: '/dashboard',
          icon: <EventNoteOutlined fontSize="small" />,
          match: (p) => p === '/dashboard' || p.startsWith('/dashboard'),
        },
        {
          key: 'host-dash',
          label: 'Host dashboard',
          kind: 'link',
          to: '/host',
          icon: <StorefrontOutlined fontSize="small" />,
          match: (p) => p === '/host' || p.startsWith('/host'),
        },
      ]
    : []

  const renderRow = (row: NavRow) => {
    const selected = row.match(pathname, hash)

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
      {MAIN_NAV.map(renderRow)}

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
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 2.25,
          py: 2.25,
          textDecoration: 'none',
          color: 'inherit',
          borderBottom: 1,
          borderColor: 'divider',
          transition: 'background-color 0.2s ease',
          '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
        }}
      >
        <DirectionsCarOutlined sx={{ color: 'primary.main', fontSize: 30 }} />
        <Typography variant="h6" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' }}>
          rentaHub
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
        <AppNavigationList onAuthOpen={onAuthOpen} onLogout={onLogout} />
      </Box>
    </Box>
  )
}
