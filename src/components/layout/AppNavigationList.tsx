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
import { useEffect, useLayoutEffect, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import RentaraLogoMark from '../brand/RentaraLogoMark'
import { prefetchAuthDialogChunk } from '../../lib/prefetchAuthDialog'
import { prefetchExploreNavChunks, prefetchPath } from '../../lib/routePrefetch'
import { useT } from '@/hooks/useT'
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

const VEHICLE_QUICK_FILTER: { key: string; labelKey: 'nav.cars' | 'nav.motorcycles' | 'nav.scooters' | 'nav.bigBikes'; vt: VehicleType; icon: ReactNode }[] = [
  { key: 'v-car', labelKey: 'nav.cars', vt: 'car', icon: <DirectionsCarOutlined fontSize="small" /> },
  { key: 'v-moto', labelKey: 'nav.motorcycles', vt: 'motorcycle', icon: <TwoWheelerOutlined fontSize="small" /> },
  { key: 'v-sco', labelKey: 'nav.scooters', vt: 'scooter', icon: <ElectricMopedOutlined fontSize="small" /> },
  { key: 'v-bb', labelKey: 'nav.bigBikes', vt: 'bigbike', icon: <SportsMotorsportsOutlined fontSize="small" /> },
]

function getVtParam(search: string) {
  return new URLSearchParams(search).get('vt')
}

function navLinkPrefetchHandlers(to: string): { onPointerDown: () => void; onFocus: () => void } {
  return {
    /** Prefetch on press — avoids work on mere `pointerenter` passes across the list. */
    onPointerDown: () => prefetchPath(to),
    /** Keyboard / focus users still warm the route once per focused link (deduped in `prefetchPath`). */
    onFocus: () => prefetchPath(to),
  }
}

const EXPLORE_CORE_ICONS = {
  home: <HomeOutlined fontSize="small" />,
  browse: <SearchOutlined fontSize="small" />,
  map: <MapOutlined fontSize="small" />,
} as const

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

const NAV_MOTION = 'background-color 0.16s ease, color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease'

function navItemSx(theme: Theme, selected: boolean, rail: boolean) {
  const iconColor = selected ? theme.palette.primary.main : theme.palette.text.secondary
  return {
    position: 'relative' as const,
    mx: rail ? 0.5 : 1,
    borderRadius: 2,
    py: rail ? 1 : 1.15,
    px: rail ? 0.5 : undefined,
    pr: rail ? undefined : 1.5,
    pl: rail ? undefined : 1.25,
    mb: 0.25,
    minHeight: 48,
    justifyContent: rail ? 'center' : undefined,
    transition: NAV_MOTION,
    bgcolor: selected ? alpha(theme.palette.primary.main, 0.12) : undefined,
    color: selected ? theme.palette.primary.main : undefined,
    fontWeight: selected ? 700 : undefined,
    '& .MuiListItemIcon-root': {
      minWidth: rail ? 0 : undefined,
      justifyContent: rail ? 'center' : undefined,
      margin: rail ? 0 : undefined,
      color: iconColor,
      transition: 'color 0.16s ease',
    },
    '&:hover': {
      bgcolor: alpha(theme.palette.primary.main, selected ? 0.16 : 0.06),
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.38)}`,
    },
    ...(selected
      ? {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: rail ? 10 : 8,
            bottom: rail ? 10 : 8,
            width: 3,
            borderRadius: '0 3px 3px 0',
            bgcolor: theme.palette.primary.main,
          },
        }
      : {}),
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
  const t = useT()

  useLayoutEffect(() => {
    prefetchExploreNavChunks()
  }, [])

  const hostRow: NavRow = user?.isHost
    ? {
        key: 'list',
        label: t('nav.listVehicle'),
        kind: 'link',
        to: '/host?section=list',
        icon: <DirectionsCarOutlined fontSize="small" />,
      }
    : {
        key: 'host-invite',
        label: t('nav.becomeHost'),
        kind: 'link',
        to: '/become-a-host',
        icon: <StorefrontOutlined fontSize="small" />,
      }

  const exploreNav: NavRow[] = [
    { key: 'home', label: t('nav.home'), kind: 'link', to: '/', icon: EXPLORE_CORE_ICONS.home },
    { key: 'browse', label: t('nav.browse'), kind: 'link', to: '/search', icon: EXPLORE_CORE_ICONS.browse },
    { key: 'map', label: t('nav.map'), kind: 'link', to: '/map', icon: EXPLORE_CORE_ICONS.map },
    hostRow,
  ]

  const accountLinks: NavRow[] = user
    ? [
        {
          key: 'my-trips',
          label: t('nav.myTrips'),
          kind: 'link',
          to: '/dashboard?nav=trips',
          icon: <LuggageOutlined fontSize="small" />,
        },
        {
          key: 'dashboard',
          label: t('nav.dashboard'),
          kind: 'link',
          to: '/dashboard?nav=profile',
          icon: <EventNoteOutlined fontSize="small" />,
        },
        {
          key: 'messages',
          label: t('nav.messages'),
          kind: 'link',
          to: '/messages',
          icon: <ChatBubbleOutline fontSize="small" />,
        },
        ...(user.isHost
          ? [
              {
                key: 'host-dash',
                label: t('nav.hostDashboard'),
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
      <Tooltip key={listKey} title={label} placement="right" enterDelay={0} enterNextDelay={0} leaveDelay={0}>
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
          onPointerDown={() => prefetchAuthDialogChunk()}
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
        {...navLinkPrefetchHandlers(row.to!)}
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
      {!rail ? <SectionLabel>{t('nav.explore')}</SectionLabel> : null}
      {exploreNav.map(renderRow)}

      {!user ? (
        <>
          {!rail ? <SectionLabel>{t('nav.vehicles')}</SectionLabel> : null}
          {VEHICLE_QUICK_FILTER.map((row) => {
            const selected = pathname.startsWith('/search') && getVtParam(search) === row.vt
            const label = t(row.labelKey)
            const vbtn = (
              <ListItemButton
                key={row.key}
                component={RouterLink}
                to={`/search?vt=${row.vt}`}
                selected={selected}
                {...navLinkPrefetchHandlers(`/search?vt=${row.vt}`)}
                onClick={() => onNavigate?.()}
                sx={(theme) => navItemSx(theme, selected, rail)}
              >
                <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>{row.icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: '0.9375rem' }}
                />
              </ListItemButton>
            )
            return rail ? wrapRail(row.key, label, vbtn) : vbtn
          })}
        </>
      ) : null}

      {user ? (
        <>
          {!rail ? <SectionLabel>{t('nav.yourAccount')}</SectionLabel> : null}
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
                <ListItemText primary={t('nav.signOut')} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
              </ListItemButton>
            )
            return rail ? wrapRail('sign-out', t('nav.signOut'), out) : out
          })()}
        </>
      ) : (
        <>
          {!rail ? <SectionLabel>{t('nav.access')}</SectionLabel> : null}
          {(() => {
            const signIn = (
              <ListItemButton
                key="sign-in"
                onPointerDown={() => prefetchAuthDialogChunk()}
                onClick={() => {
                  onAuthOpen?.()
                  onNavigate?.()
                }}
                sx={(theme) => navItemSx(theme, false, rail)}
              >
                <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>
                  <LoginOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav.signIn')} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
              </ListItemButton>
            )
            const getStarted = (
              <ListItemButton
                key="get-started"
                onPointerDown={() => prefetchAuthDialogChunk()}
                onClick={() => {
                  onAuthOpen?.()
                  onNavigate?.()
                }}
                sx={(theme) => navItemSx(theme, false, rail)}
              >
                <ListItemIcon sx={rail ? undefined : { minWidth: 40 }}>
                  <PersonAddOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav.getStarted')} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
              </ListItemButton>
            )
            return rail ? (
              <>
                {wrapRail('sign-in', t('nav.signIn'), signIn)}
                {wrapRail('get-started', t('nav.getStarted'), getStarted)}
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
  const t = useT()
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
        <Tooltip title={t('nav.expandNav')} placement="right" enterDelay={0} enterNextDelay={0} leaveDelay={0}>
          <IconButton
            aria-label={t('nav.expandNav')}
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
            transition: NAV_MOTION,
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
            transition: NAV_MOTION,
            '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
          }}
        >
          <RentaraLogoMark size="md" variant="navLockup" showTextFallback />
        </Box>
        {isMapRoute ? (
          <Tooltip title={t('nav.collapseNav')} placement="right" enterDelay={0} enterNextDelay={0} leaveDelay={0}>
            <IconButton
              aria-label={t('nav.collapseNav')}
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
      aria-label={t('nav.mainNav')}
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
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
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
