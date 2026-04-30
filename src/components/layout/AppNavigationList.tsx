import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import ElectricMopedOutlined from '@mui/icons-material/ElectricMopedOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import LoginOutlined from '@mui/icons-material/LoginOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import LuggageOutlined from '@mui/icons-material/LuggageOutlined'
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import SportsMotorsportsOutlined from '@mui/icons-material/SportsMotorsportsOutlined'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import TwoWheelerOutlined from '@mui/icons-material/TwoWheelerOutlined'
import {
  alpha,
  Badge,
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline'
import type { Theme } from '@mui/material/styles'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import RentaraLogoMark from '../brand/RentaraLogoMark'
import { prefetchAuthDialogChunk } from '../../lib/prefetchAuthDialog'
import { useAuthStore } from '../../store/useAuthStore'
import { useChatUnreadForCurrentUser } from '../../store/useChatStore'
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

const EXPLORE_CORE: NavRow[] = [
  {
    key: 'home',
    label: 'Home',
    kind: 'link',
    to: '/',
    icon: <HomeOutlined fontSize="small" />,
  },
  {
    key: 'browse',
    label: 'Browse vehicles',
    kind: 'link',
    to: '/search',
    icon: <SearchOutlined fontSize="small" />,
  },
  {
    key: 'map',
    label: 'Map',
    kind: 'link',
    to: '/map',
    icon: <MapOutlined fontSize="small" />,
  },
]

const BECOME_HOST_ROW: NavRow = {
  key: 'host-invite',
  label: 'Become a host',
  kind: 'link',
  to: '/become-a-host',
  icon: <StorefrontOutlined fontSize="small" />,
}

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

function navItemSx(theme: Theme, selected: boolean, rail: boolean) {
  const base = rail
    ? ({
        mx: 0.5,
        borderRadius: 2,
        py: 1,
        px: 0.5,
        mb: 0.25,
        minHeight: 48,
        justifyContent: 'center',
        transition: 'background-color 0.18s ease, color 0.18s ease',
        '& .MuiListItemText-root': { display: 'none' },
        '& .MuiListItemIcon-root': {
          minWidth: 0,
          justifyContent: 'center',
          margin: 0,
        },
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.06),
        },
      } as const)
    : ({
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
      } as const)
  if (selected) {
    return {
      ...base,
      bgcolor: alpha(theme.palette.primary.main, 0.12),
      color: theme.palette.primary.main,
      fontWeight: 700,
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, 0.16),
        transform: rail ? undefined : 'none',
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
  /** Icon-only nav (narrow rail); pair with a collapsed app sidebar on `/map`. */
  density?: 'comfortable' | 'rail'
}

export default function AppNavigationList({
  onNavigate,
  onAuthOpen,
  onLogout,
  density = 'comfortable',
}: AppNavigationListProps) {
  const rail = density === 'rail'
  const location = useLocation()
  const pathname = location.pathname
  const hash = location.hash
  const search = location.search
  const user = useAuthStore((s) => s.user)
  const chatUnread = useChatUnreadForCurrentUser()

  const exploreNav: NavRow[] = user
    ? [...EXPLORE_CORE, ...(user.isHost ? [LIST_VEHICLE_ROW] : [BECOME_HOST_ROW])]
    : [...EXPLORE_CORE, BECOME_HOST_ROW]

  const accountLinks: NavRow[] = user
    ? [
        {
          key: 'my-trips',
          label: 'My Trips',
          kind: 'link',
          to: '/dashboard?nav=trips',
          icon: <LuggageOutlined fontSize="small" />,
        },
        {
          key: 'dashboard',
          label: 'Dashboard',
          kind: 'link',
          to: '/dashboard?nav=profile',
          icon: <EventNoteOutlined fontSize="small" />,
        },
        {
          key: 'messages',
          label: 'Messages',
          kind: 'link',
          to: '/messages',
          icon: <ChatBubbleOutline fontSize="small" />,
        },
        ...(user.isHost
          ? [
              {
                key: 'host-dash',
                label: 'Host dashboard',
                kind: 'link' as const,
                to: '/host',
                icon: <StorefrontOutlined fontSize="small" />,
              },
            ]
          : []),
      ]
    : []

  const wrapRail = (listKey: string, label: string, node: ReactElement) =>
    rail ? (
      <Tooltip key={listKey} title={label} placement="right" enterDelay={300}>
        {node}
      </Tooltip>
    ) : (
      node
    )

  const renderRow = (row: NavRow) => {
    const selected = resolveNavItemSelected(row.key, pathname, hash, search, user)

    if (row.kind === 'auth') {
      const btn = (
        <ListItemButton
          key={row.key}
          onPointerEnter={() => prefetchAuthDialogChunk()}
          onClick={() => {
            onAuthOpen?.()
            onNavigate?.()
          }}
          sx={(theme) => navItemSx(theme, false, rail)}
        >
          <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>{row.icon}</ListItemIcon>
          <ListItemText primary={row.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
        </ListItemButton>
      )
      return rail ? wrapRail(row.key, row.label, btn) : btn
    }

    if (row.kind === 'logout') {
      const btn = (
        <ListItemButton
          key={row.key}
          onClick={() => {
            onLogout?.()
            onNavigate?.()
          }}
          sx={(theme) => navItemSx(theme, false, rail)}
        >
          <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>{row.icon}</ListItemIcon>
          <ListItemText primary={row.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
        </ListItemButton>
      )
      return rail ? wrapRail(row.key, row.label, btn) : btn
    }

    const btn = (
      <ListItemButton
        key={row.key}
        component={RouterLink}
        to={row.to!}
        selected={selected}
        onClick={() => onNavigate?.()}
        sx={(theme) => navItemSx(theme, selected, rail)}
      >
        <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>
          {row.key === 'messages' && chatUnread > 0 ? (
            <Badge
              color="error"
              badgeContent={chatUnread > 9 ? '9+' : chatUnread}
              overlap="circular"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box component="span" sx={{ display: 'inline-flex' }}>
                {row.icon}
              </Box>
            </Badge>
          ) : (
            row.icon
          )}
        </ListItemIcon>
        <ListItemText primary={row.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: '0.9375rem' }} />
      </ListItemButton>
    )
    return rail ? wrapRail(row.key, row.label, btn) : btn
  }

  return (
    <List component="nav" disablePadding sx={{ py: 1, ...(rail ? { px: 0.25 } : {}) }}>
      {!rail ? <SectionLabel>Explore</SectionLabel> : null}
      {exploreNav.map(renderRow)}

      {!user ? (
        <>
          {!rail ? <SectionLabel>Vehicles</SectionLabel> : null}
          {VEHICLE_QUICK_FILTER.map((row) => {
            const selected = pathname.startsWith('/search') && getVtParam(search) === row.vt
            const vbtn = (
              <ListItemButton
                key={row.key}
                component={RouterLink}
                to={`/search?vt=${row.vt}`}
                selected={selected}
                onClick={() => onNavigate?.()}
                sx={(theme) => navItemSx(theme, selected, rail)}
              >
                <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>{row.icon}</ListItemIcon>
                <ListItemText
                  primary={row.label}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: '0.9375rem' }}
                />
              </ListItemButton>
            )
            return rail ? wrapRail(row.key, row.label, vbtn) : vbtn
          })}
        </>
      ) : null}

      {user ? (
        <>
          {!rail ? <SectionLabel>Your account</SectionLabel> : null}
          {accountLinks.map(renderRow)}
          {(() => {
            const out = (
              <ListItemButton
                key="sign-out"
                onClick={() => {
                  onLogout?.()
                  onNavigate?.()
                }}
                sx={(theme) => navItemSx(theme, false, rail)}
              >
                <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>
                  <LogoutOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
              </ListItemButton>
            )
            return rail ? wrapRail('sign-out', 'Sign Out', out) : out
          })()}
        </>
      ) : (
        <>
          {!rail ? <SectionLabel>Access</SectionLabel> : null}
          {(() => {
            const signIn = (
              <ListItemButton
                key="sign-in"
                onPointerEnter={() => prefetchAuthDialogChunk()}
                onClick={() => {
                  onAuthOpen?.()
                  onNavigate?.()
                }}
                sx={(theme) => navItemSx(theme, false, rail)}
              >
                <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>
                  <LoginOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sign In" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
              </ListItemButton>
            )
            const getStarted = (
              <ListItemButton
                key="get-started"
                onPointerEnter={() => prefetchAuthDialogChunk()}
                onClick={() => {
                  onAuthOpen?.()
                  onNavigate?.()
                }}
                sx={(theme) => navItemSx(theme, false, rail)}
              >
                <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>
                  <PersonAddOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Get Started" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
              </ListItemButton>
            )
            return rail ? (
              <>
                {wrapRail('sign-in', 'Sign In', signIn)}
                {wrapRail('get-started', 'Get Started', getStarted)}
              </>
            ) : (
              <>
                {signIn}
                {getStarted}
              </>
            )
          })()}
        </>
      )}
    </List>
  )
}

const MAP_NAV_RAIL_COLLAPSED_KEY = 'rentara-map-nav-rail-collapsed'

/** Desktop persistent rail; on `/map` the user can collapse to an icon rail for more map width. */
export function AppNavSidebar({ onAuthOpen, onLogout }: { onAuthOpen: () => void; onLogout: () => void }) {
  const location = useLocation()
  const isMapRoute = location.pathname === '/map'
  const [mapNavCollapsed, setMapNavCollapsed] = useState(false)

  useEffect(() => {
    try {
      setMapNavCollapsed(window.localStorage.getItem(MAP_NAV_RAIL_COLLAPSED_KEY) === '1')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!isMapRoute) return
    try {
      window.localStorage.setItem(MAP_NAV_RAIL_COLLAPSED_KEY, mapNavCollapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [isMapRoute, mapNavCollapsed])

  useEffect(() => {
    if (!isMapRoute) return
    const id = window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('rentara-map-shell-resize'))
    })
    return () => window.cancelAnimationFrame(id)
  }, [isMapRoute, mapNavCollapsed])

  const rail = isMapRoute && mapNavCollapsed
  const navWidth = rail ? 72 : 268

  const brandRow =
    rail ? (
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tooltip title="Expand navigation" placement="right">
          <IconButton
            aria-label="Expand navigation"
            size="small"
            onClick={() => setMapNavCollapsed(false)}
            sx={{ color: 'text.secondary' }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box
          component={RouterLink}
          to="/"
          className="rentara-brand-lockup"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.5,
            textDecoration: 'none',
            color: 'inherit',
            borderRadius: 2,
            transition: 'background-color 0.2s ease',
            '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) },
          }}
        >
          <RentaraLogoMark size="sm" variant="mark" showTextFallback={false} />
        </Box>
      </Box>
    ) : (
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          minHeight: { md: 64 },
          borderBottom: 1,
          borderColor: 'divider',
          boxSizing: 'border-box',
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          className="rentara-brand-lockup"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flex: 1,
            minWidth: 0,
            px: { xs: 2, md: 2.5 },
            py: 0,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background-color 0.2s ease, transform 0.22s ease-in-out',
            '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
            '@media (hover: hover)': {
              '&:hover': { transform: 'scale(1.02)' },
            },
          }}
        >
          <RentaraLogoMark size="md" variant="navLockup" showTextFallback />
        </Box>
        {isMapRoute ? (
          <Tooltip title="Collapse navigation" placement="right">
            <IconButton
              aria-label="Collapse navigation"
              size="small"
              onClick={() => setMapNavCollapsed(true)}
              sx={{ mr: 1, flexShrink: 0, color: 'text.secondary' }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
    )

  return (
    <Box
      component="aside"
      aria-label="Main navigation"
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        width: navWidth,
        flexShrink: 0,
        alignSelf: 'stretch',
        minHeight: 0,
        overflow: 'hidden',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        transition: 'width 0.22s ease',
      }}
    >
      {brandRow}

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', py: 0.5 }}>
        <AppNavigationList
          onAuthOpen={onAuthOpen}
          onLogout={onLogout}
          density={rail ? 'rail' : 'comfortable'}
        />
      </Box>
    </Box>
  )
}
