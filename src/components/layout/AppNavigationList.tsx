import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ArrowForward from '@mui/icons-material/ArrowForward'
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
  Button,
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
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import RentaraLogoMark from '../brand/RentaraLogoMark'
import { prefetchAuthDialogChunk } from '../../lib/prefetchAuthDialog'
import { prefetchExploreNavChunks, prefetchPath } from '../../lib/routePrefetch'
import { useT } from '@/hooks/useT'
import { useAuthStore } from '../../store/useAuthStore'
import { useCarsStore } from '../../store/useCarsStore'
import { useChatUnreadForCurrentUser } from '../../store/useChatStore'
import { rhRadius } from '../../theme/tokens'
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
        px: 2.75,
        pt: 2.25,
        pb: 0.75,
        fontWeight: 700,
        fontSize: '0.6875rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'text.secondary',
        opacity: 0.8,
      }}
    >
      {children}
    </Typography>
  )
}

const NAV_MOTION = 'background-color 0.16s ease, color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease'

function navItemSx(theme: Theme, selected: boolean, rail: boolean) {
  const primary = theme.palette.primary.main
  const selectedBg = alpha(primary, theme.palette.mode === 'dark' ? 0.2 : 0.1)
  const hoverBg = selected
    ? alpha(primary, theme.palette.mode === 'dark' ? 0.26 : 0.14)
    : alpha(theme.palette.text.primary, 0.05)
  return {
    position: 'relative' as const,
    mx: rail ? 0.75 : 1.25,
    borderRadius: `${rhRadius.md}px`,
    py: rail ? 1 : 0.875,
    px: rail ? 0.5 : undefined,
    pr: rail ? undefined : 1.25,
    pl: rail ? undefined : 1.5,
    mb: 0.25,
    minHeight: 44,
    justifyContent: rail ? 'center' : undefined,
    transition: NAV_MOTION,
    color: selected ? primary : theme.palette.text.primary,
    bgcolor: selected ? selectedBg : 'transparent',
    '&.Mui-selected': { bgcolor: selectedBg },
    '&.Mui-selected:hover, &:hover': { bgcolor: hoverBg },
    '& .MuiListItemIcon-root': {
      minWidth: rail ? 0 : 36,
      justifyContent: rail ? 'center' : undefined,
      margin: rail ? 0 : undefined,
      color: selected ? primary : theme.palette.text.secondary,
      transition: 'color 0.16s ease',
    },
    '&:hover .MuiListItemIcon-root': { color: selected ? primary : theme.palette.text.primary },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${alpha(primary, 0.32)}`,
    },
    ...(selected
      ? {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: rail ? 10 : 11,
            bottom: rail ? 10 : 11,
            width: 3,
            borderRadius: '0 3px 3px 0',
            bgcolor: primary,
          },
        }
      : {}),
  }
}

/** Muted count pill at the end of a row (listings per vehicle type). */
function CountPill({ value, selected }: { value: number; selected: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        ml: 1,
        minWidth: 26,
        px: 0.875,
        py: 0.125,
        borderRadius: `${rhRadius.pill}px`,
        textAlign: 'center',
        fontSize: '0.75rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: selected ? 'primary.main' : 'text.secondary',
        bgcolor: (th) => (selected ? alpha(th.palette.primary.main, 0.12) : alpha(th.palette.text.primary, 0.06)),
      }}
    >
      {value}
    </Box>
  )
}

/** Guest sign-in card: replaces two nav rows that both opened the same dialog. */
function SignInCard({ onAuthOpen, onNavigate }: { onAuthOpen?: () => void; onNavigate?: () => void }) {
  const t = useT()
  const open = () => {
    onAuthOpen?.()
    onNavigate?.()
  }
  return (
    <Box
      sx={{
        mx: 1.25,
        p: 1.75,
        borderRadius: `${rhRadius.lg}px`,
        bgcolor: (th) => alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.14 : 0.06),
        border: '1px solid',
        borderColor: (th) => alpha(th.palette.primary.main, 0.16),
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
        {t('nav.signInCardTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8125rem', lineHeight: 1.45 }}>
        {t('nav.signInCardBody')}
      </Typography>
      <Button
        fullWidth
        variant="contained"
        disableElevation
        onPointerDown={() => prefetchAuthDialogChunk()}
        onClick={open}
        startIcon={<LoginOutlined fontSize="small" />}
        sx={{ mt: 1.25, minHeight: 38, fontWeight: 700, borderRadius: `${rhRadius.md}px` }}
      >
        {t('nav.signIn')}
      </Button>
      <Button
        fullWidth
        onPointerDown={() => prefetchAuthDialogChunk()}
        onClick={open}
        sx={{ mt: 0.25, minHeight: 34, fontWeight: 700, borderRadius: `${rhRadius.md}px` }}
      >
        {t('nav.createAccount')}
      </Button>
    </Box>
  )
}

/** Compact hosting promo for anyone who is not a host yet. */
function HostPromoCard({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT()
  return (
    <Box
      component={RouterLink}
      to="/become-a-host"
      onPointerDown={() => prefetchPath('/become-a-host')}
      onClick={() => onNavigate?.()}
      sx={{
        mx: 1.25,
        p: 1.25,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        borderRadius: `${rhRadius.lg}px`,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
        textDecoration: 'none',
        transition: NAV_MOTION,
        '&:hover': {
          borderColor: (th) => alpha(th.palette.primary.main, 0.4),
          boxShadow: (th) => `0 6px 18px ${alpha(th.palette.common.black, 0.06)}`,
        },
        '&:hover .host-arrow': { transform: 'translateX(2px)', color: 'primary.main' },
        '&:focus-visible': { outline: 'none', boxShadow: (th) => `0 0 0 3px ${alpha(th.palette.primary.main, 0.32)}` },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: `${rhRadius.md}px`,
          display: 'grid',
          placeItems: 'center',
          color: '#059669',
          bgcolor: (th) => alpha('#10B981', th.palette.mode === 'dark' ? 0.2 : 0.12),
        }}
      >
        <StorefrontOutlined fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', lineHeight: 1.25 }}>{t('nav.hostCardTitle')}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.35 }}>
          {t('nav.hostCardBody')}
        </Typography>
      </Box>
      <ArrowForward className="host-arrow" sx={{ fontSize: 18, color: 'text.secondary', transition: NAV_MOTION }} />
    </Box>
  )
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
  const cars = useCarsStore((s) => s.cars)
  const t = useT()
  const typeCounts = useMemo(() => {
    const out: Partial<Record<VehicleType, number>> = {}
    for (const c of cars) out[c.vehicleType] = (out[c.vehicleType] ?? 0) + 1
    return out
  }, [cars])

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
    ...(user?.isHost || rail ? [hostRow] : []),
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
          <ListItemIcon>{row.icon}</ListItemIcon>
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
          <ListItemIcon>{row.icon}</ListItemIcon>
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
        <ListItemIcon>
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

  const list = (
    <List component="nav" disablePadding sx={{ py: 1, ...(rail ? { px: 0.25 } : {}) }}>
      {!rail ? <SectionLabel>{t('nav.explore')}</SectionLabel> : null}
      {exploreNav.map(renderRow)}

      {(
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
                <ListItemIcon>{row.icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: '0.9375rem' }}
                />
                {!rail && (typeCounts[row.vt] ?? 0) > 0 ? (
                  <CountPill value={typeCounts[row.vt] ?? 0} selected={selected} />
                ) : null}
              </ListItemButton>
            )
            return rail ? wrapRail(row.key, label, vbtn) : vbtn
          })}
        </>
      )}

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
                <ListItemIcon>
                  <LogoutOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav.signOut')} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
              </ListItemButton>
            )
            return rail ? wrapRail('sign-out', t('nav.signOut'), out) : out
          })()}
        </>
      ) : rail ? (
        <>
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
                <ListItemIcon>
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
                <ListItemIcon>
                  <PersonAddOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav.getStarted')} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }} />
              </ListItemButton>
            )
            return (
              <>
                {wrapRail('sign-in', t('nav.signIn'), signIn)}
                {wrapRail('get-started', t('nav.getStarted'), getStarted)}
              </>
            )
          })()}
        </>
      ) : null}
    </List>
  )

  if (rail) return list

  const showHostPromo = !user?.isHost
  const showSignIn = !user
  return (
    <>
      {list}
      {showHostPromo || showSignIn ? (
        // Pinned to the bottom of the flex-column nav container; scrolls with the list when space is short.
        <Box sx={{ mt: 'auto', pt: 1.5, pb: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {showHostPromo ? <HostPromoCard onNavigate={onNavigate} /> : null}
          {showSignIn ? <SignInCard onAuthOpen={onAuthOpen} onNavigate={onNavigate} /> : null}
        </Box>
      ) : null}
    </>
  )
}

const MAP_NAV_RAIL_COLLAPSED_KEY = 'rentara-map-nav-rail-collapsed'

/** Expanded desktop nav rail — keep filter overlays in the main column, not over this rail. */
export const APP_NAV_SIDEBAR_EXPANDED_PX = 268

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
  const navWidth = rail ? 72 : APP_NAV_SIDEBAR_EXPANDED_PX

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
        // Sticky full-height rail: stays visible while the page scrolls, cards pinned to its bottom.
        position: 'sticky',
        top: 0,
        height: '100vh',
        alignSelf: 'flex-start',
        minHeight: 0,
        overflow: 'hidden',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {brandRow}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 0.5,
          display: 'flex',
          flexDirection: 'column',
          scrollbarWidth: 'thin',
        }}
      >
        <AppNavigationList
          onAuthOpen={onAuthOpen}
          onLogout={onLogout}
          density={rail ? 'rail' : 'comfortable'}
        />
      </Box>
    </Box>
  )
}
