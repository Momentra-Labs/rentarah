import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline'
import Close from '@mui/icons-material/Close'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import LuggageOutlined from '@mui/icons-material/LuggageOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import MyLocation from '@mui/icons-material/MyLocation'
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import {
  AppBar,
  Badge,
  Box,
  Button,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useRef, useState, memo, type MouseEventHandler } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import RentaraLogoMark from '../brand/RentaraLogoMark'
import UserAvatar from '../common/UserAvatar'
import NotificationPanelContent from '../notifications/NotificationPanelContent'
import { prefetchAuthDialogChunk } from '../../lib/prefetchAuthDialog'
import { prefetchPath } from '../../lib/routePrefetch'
import { MOBILE_APP_BAR_TOOLBAR_PX } from '../../constants/mobileShell'
import { containerGutters } from '../../theme/pageStyles'
import { rhElev, rhRadius } from '../../theme/tokens'
import AppNavigationList from './AppNavigationList'
import LanguageSwitcher from './LanguageSwitcher'
import { useT } from '@/hooks/useT'
import GeolocationShareDialog from './GeolocationShareDialog'
import { useAuthStore } from '../../store/useAuthStore'
import { useGeolocationStore } from '../../store/useGeolocationStore'
import { useNotificationStore, useUnreadNotificationCount } from '../../store/useNotificationStore'
import { useChatUnreadForCurrentUser } from '../../store/useChatStore'

export type NavbarProps = {
  onAuthOpen: () => void
}

export default memo(function Navbar({ onAuthOpen }: NavbarProps) {
  const theme = useTheme()
  const isMd = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const t = useT()

  const [elevated, setElevated] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  /** Preserve page scroll when the mobile drawer closes (Modal scroll lock / focus restore can jump to top). */
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const scrollSnapshotRef = useRef<{ y: number; loc: string } | null>(null)

  const openMobileDrawer = useCallback(() => {
    scrollSnapshotRef.current = {
      y: window.scrollY,
      loc: `${location.pathname}${location.search}${location.hash}`,
    }
    setMobileOpen(true)
  }, [location.hash, location.pathname, location.search])

  const closeMobileDrawer = useCallback(() => {
    // Focus leaves the drawer before MuiModal applies aria-hidden during exit — avoids a11y mismatch with a focused link inside.
    mobileMenuButtonRef.current?.focus({ preventScroll: true })
    setMobileOpen(false)
  }, [])

  const restoreScrollAfterDrawer = useCallback(() => {
    const snap = scrollSnapshotRef.current
    scrollSnapshotRef.current = null
    const nowLoc = `${location.pathname}${location.search}${location.hash}`

    const focusMenu = () => mobileMenuButtonRef.current?.focus({ preventScroll: true })

    if (!snap) {
      focusMenu()
      return
    }

    if (snap.loc !== nowLoc) {
      focusMenu()
      return
    }

    const scroll = () => window.scrollTo(0, snap.y)
    scroll()
    requestAnimationFrame(() => {
      scroll()
      requestAnimationFrame(scroll)
    })
    focusMenu()
  }, [location.hash, location.pathname, location.search])
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const accountMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const [notifEl, setNotifEl] = useState<null | HTMLElement>(null)
  const openGeoDialog = useGeolocationStore((s) => s.openGeoDialog)
  const geoActive = useGeolocationStore((s) => s.status === 'ready' && s.userLocation != null)
  const unread = useUnreadNotificationCount()
  const chatUnread = useChatUnreadForCurrentUser()
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)

  const onNotificationBellClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (isMd) {
      setNotifEl(null)
      navigate('/notifications')
    } else {
      setNotifEl(e.currentTarget)
    }
  }

  const onNotifViewOne = useCallback(
    (id: string) => {
      markAsRead(id)
    },
    [markAsRead],
  )

  /** Coalesce scroll reads to once per animation frame — avoids React updates on high-frequency wheel/touch scrolling. */
  useEffect(() => {
    let raf = 0
    let lastElevated = window.scrollY > 50
    setElevated(lastElevated)
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const next = window.scrollY > 50
        if (next !== lastElevated) {
          lastElevated = next
          setElevated(next)
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    if (isMd) setNotifEl(null)
  }, [isMd])

  useEffect(() => {
    setNotifEl(null)
  }, [location.pathname])

  const onSearchPage = location.pathname.startsWith('/search')
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      if (onSearchPage) return
      e.preventDefault()
      navigate('/search')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, onSearchPage])

  const notifAria = `${t('nav.notifications')}${unread > 0 ? `, ${unread}` : ''}`
  const closeAccountMenu = () => setAnchor(null)
  const go = (to: string) => {
    setAnchor(null)
    navigate(to)
  }
  const menuIconSx = { minWidth: 36, color: 'text.secondary' } as const

  const geoButton = (
    <Tooltip title={geoActive ? t('nav.geoOn') : t('nav.geoOff')}>
      <IconButton
        onClick={() => openGeoDialog()}
        aria-label={geoActive ? t('nav.geoOn') : t('nav.geoOff')}
        sx={{
          minWidth: 44,
          minHeight: 44,
          color: geoActive ? 'primary.main' : 'text.secondary',
          bgcolor: geoActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, geoActive ? 0.16 : 0.06) },
        }}
      >
        <MyLocation fontSize="small" />
      </IconButton>
    </Tooltip>
  )

  const bellButton = (
    <Tooltip title={t('nav.notifications')}>
      <IconButton onClick={onNotificationBellClick} aria-label={notifAria} sx={{ minWidth: 44, minHeight: 44, color: 'text.secondary' }}>
        <Badge
          color="error"
          badgeContent={unread > 9 ? '9+' : unread}
          invisible={unread === 0}
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 18, height: 18, fontWeight: 700 } }}
        >
          <NotificationsOutlined />
        </Badge>
      </IconButton>
    </Tooltip>
  )

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          color: 'text.primary',
          overflow: 'visible',
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.82 : 0.88),
          backgroundImage: 'none',
          backdropFilter: 'saturate(180%) blur(14px)',
          WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          borderBottom: '1px solid',
          borderColor: elevated ? 'divider' : alpha(theme.palette.divider, 0.6),
          boxShadow: elevated
            ? `0 8px 24px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.32 : 0.06)}`
            : 'none',
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
          pt: { xs: 'env(safe-area-inset-top, 0px)', md: 0 },
        }}
      >
        <Toolbar
          sx={{
            width: '100%',
            mx: 'auto',
            ...containerGutters,
            minHeight: { xs: MOBILE_APP_BAR_TOOLBAR_PX, md: 64 },
            height: { xs: MOBILE_APP_BAR_TOOLBAR_PX, md: 64 },
            boxSizing: 'border-box',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            component={RouterLink}
            to="/"
            className="rentara-brand-lockup"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              mr: 2,
              minWidth: 0,
              flex: '0 0 auto',
              display: { xs: 'flex', md: 'none' },
              borderRadius: 2,
              px: 0.5,
              py: 0.5,
              ml: -0.5,
              transition: 'background-color 160ms ease',
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
              '&:focus-visible': { outline: 'none', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.28)}` },
            }}
          >
            <RentaraLogoMark size="sm" variant="navLockup" />
          </Stack>

          <Box sx={{ flex: 1, minWidth: 0, display: { xs: 'none', md: 'flex' }, alignItems: 'center', pr: 2 }}>
            {!onSearchPage ? (
              <ButtonBase
                onClick={() => navigate('/search')}
                onPointerDown={() => prefetchPath('/search')}
                aria-label={t('nav.searchPlaceholder')}
                aria-keyshortcuts="/"
                sx={{
                  width: '100%',
                  maxWidth: 460,
                  height: 44,
                  px: 1.75,
                  gap: 1.25,
                  justifyContent: 'flex-start',
                  borderRadius: `${rhRadius.pill}px`,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.06 : 0.03),
                  color: 'text.secondary',
                  transition: 'border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease',
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.45),
                    bgcolor: 'background.paper',
                    boxShadow: rhElev.elev1,
                  },
                  '&.Mui-focusVisible': { boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}` },
                }}
              >
                <SearchRounded sx={{ fontSize: 22, color: 'primary.main' }} />
                <Typography noWrap sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                  {t('nav.searchPlaceholder')}
                </Typography>
                <Box
                  component="kbd"
                  sx={{
                    ml: 'auto',
                    px: 0.875,
                    py: 0.125,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    fontFamily: 'inherit',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                    lineHeight: 1.4,
                  }}
                >
                  /
                </Box>
              </ButtonBase>
            ) : null}
          </Box>

          {!isMd &&
            (!user ? (
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                <LanguageSwitcher compact />
                {geoButton}
                <Divider orientation="vertical" flexItem sx={{ my: 1.5, mx: 0.5 }} />
                <Button
                  variant="text"
                  color="inherit"
                  onPointerDown={() => prefetchAuthDialogChunk()}
                  onClick={() => onAuthOpen()}
                  sx={{ fontWeight: 700, borderRadius: `${rhRadius.md}px`, px: 1.75, minHeight: 40 }}
                >
                  {t('nav.signIn')}
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  onPointerDown={() => prefetchAuthDialogChunk()}
                  onClick={() => onAuthOpen()}
                  sx={{ fontWeight: 700, borderRadius: `${rhRadius.md}px`, px: 2.25, minHeight: 40 }}
                >
                  {t('nav.getStarted')}
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                <LanguageSwitcher compact />
                {geoButton}
                {bellButton}
                <IconButton
                  ref={accountMenuButtonRef}
                  onClick={(e) => setAnchor(e.currentTarget)}
                  aria-label={t('nav.openAccount')}
                  sx={{ ml: 0 }}
                >
                  <UserAvatar
                    avatar={user.avatar}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size={40}
                    sx={{
                      boxShadow: (t) =>
                        `0 0 0 2px ${t.palette.background.paper}, 0 0 0 3px ${alpha(t.palette.primary.main, 0.4)}`,
                    }}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchor}
                  open={Boolean(anchor)}
                  onClose={() => {
                    setAnchor(null)
                    requestAnimationFrame(() => {
                      accountMenuButtonRef.current?.focus({ preventScroll: true })
                    })
                  }}
                  disableScrollLock
                  disableRestoreFocus
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      minWidth: 288,
                      maxWidth: 320,
                      mt: 1,
                      borderRadius: `${rhRadius.lg}px`,
                      overflow: 'hidden',
                      border: 1,
                      borderColor: 'divider',
                      boxShadow: rhElev.elev2,
                      '& .MuiMenuItem-root': { minHeight: 44, mx: 0.75, borderRadius: `${rhRadius.sm}px`, fontWeight: 600, fontSize: '0.9375rem' },
                      '& .MuiMenu-list': { py: 0.75 },
                    },
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      pt: 2,
                      pb: 1.5,
                      background: (t) =>
                        `linear-gradient(165deg, ${alpha(t.palette.primary.main, 0.07)} 0%, ${alpha(t.palette.background.paper, 1)} 100%)`,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <UserAvatar
                        avatar={user.avatar}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        size={44}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800} noWrap letterSpacing="-0.02em">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block" title={user.email}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      fullWidth
                      size="small"
                      component={RouterLink}
                      to="/dashboard?nav=profile"
                      onClick={() => setAnchor(null)}
                      sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600, borderRadius: 1.5, borderColor: 'divider' }}
                      variant="outlined"
                      color="inherit"
                    >
                      {t('nav.viewProfile')}
                    </Button>
                  </Box>
                  <MenuItem onClick={() => go('/dashboard?nav=trips')}>
                    <ListItemIcon sx={menuIconSx}>
                      <LuggageOutlined fontSize="small" />
                    </ListItemIcon>
                    {t('nav.myTrips')}
                  </MenuItem>
                  <MenuItem onClick={() => go('/messages')}>
                    <ListItemIcon sx={menuIconSx}>
                      <ChatBubbleOutline fontSize="small" />
                    </ListItemIcon>
                    {t('nav.messages')}
                    {chatUnread > 0 ? (
                      <Box
                        component="span"
                        sx={{
                          ml: 'auto',
                          pl: 2,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            px: 0.875,
                            py: 0.125,
                            borderRadius: `${rhRadius.pill}px`,
                            bgcolor: 'error.main',
                            color: 'common.white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {chatUnread > 9 ? '9+' : chatUnread}
                        </Box>
                      </Box>
                    ) : null}
                  </MenuItem>
                  <MenuItem onClick={() => go('/notifications')}>
                    <ListItemIcon sx={menuIconSx}>
                      <NotificationsOutlined fontSize="small" />
                    </ListItemIcon>
                    {t('nav.notifications')}
                  </MenuItem>
                  <MenuItem onClick={() => go('/dashboard?nav=profile')}>
                    <ListItemIcon sx={menuIconSx}>
                      <DashboardOutlined fontSize="small" />
                    </ListItemIcon>
                    {t('nav.dashboard')}
                  </MenuItem>
                  {user.isHost ? (
                    <MenuItem onClick={() => go('/host')}>
                      <ListItemIcon sx={menuIconSx}>
                        <StorefrontOutlined fontSize="small" />
                      </ListItemIcon>
                      {t('nav.hostDashboard')}
                    </MenuItem>
                  ) : (
                    <MenuItem onClick={() => go('/become-a-host')}>
                      <ListItemIcon sx={menuIconSx}>
                        <StorefrontOutlined fontSize="small" />
                      </ListItemIcon>
                      {t('nav.becomeAHost')}
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      closeAccountMenu()
                      logout()
                      navigate('/')
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <ListItemIcon sx={{ ...menuIconSx, color: 'error.main' }}>
                      <LogoutOutlined fontSize="small" />
                    </ListItemIcon>
                    {t('nav.signOut')}
                  </MenuItem>
                </Menu>
              </Stack>
            ))}

          {isMd && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={user ? 0.5 : 1.25}
              sx={{ ml: 'auto', flexShrink: 0, pl: { xs: 1, sm: 0.5 } }}
            >
              <LanguageSwitcher compact />
              {geoButton}
              {user && bellButton}
              <IconButton
                ref={mobileMenuButtonRef}
                onClick={openMobileDrawer}
                aria-label={t('nav.openMenu')}
                edge="end"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <GeolocationShareDialog />

      <Popover
        open={Boolean(notifEl) && !isMd}
        anchorEl={notifEl}
        onClose={() => setNotifEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 0,
          sx: {
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: `${rhRadius.lg}px`,
            overflow: 'hidden',
            mt: 1,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: rhElev.elev2,
          },
        }}
        disableScrollLock
      >
        {user && (
          <NotificationPanelContent
            onViewOne={onNotifViewOne}
            onMarkAll={() => {
              markAllAsRead()
              setNotifEl(null)
            }}
            onClose={() => setNotifEl(null)}
          />
        )}
      </Popover>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={closeMobileDrawer}
        transitionDuration={280}
        ModalProps={{
          keepMounted: true,
          /** Default restore focuses the menu button and can scroll the page to the top on mobile. */
          disableRestoreFocus: true,
        }}
        SlideProps={{
          onExited: restoreScrollAfterDrawer,
        }}
        PaperProps={{
          sx: {
            width: { xs: 'min(100vw - 40px, 320px)', sm: 320 },
            borderTopLeftRadius: 20,
            borderBottomLeftRadius: 20,
            borderLeft: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            pt: 'env(safe-area-inset-top, 0px)',
            pb: `max(12px, env(safe-area-inset-bottom))`,
          }}
          role="navigation"
          aria-label={t('nav.mobileNav')}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}
          >
            <Box
              component={RouterLink}
              to="/"
              onClick={closeMobileDrawer}
              className="rentara-brand-lockup"
              sx={{ display: 'inline-flex', textDecoration: 'none', color: 'inherit' }}
            >
              <RentaraLogoMark size="sm" variant="navLockup" />
            </Box>
            <IconButton onClick={closeMobileDrawer} aria-label={t('nav.closeMenu')} sx={{ minWidth: 44, minHeight: 44 }}>
              <Close />
            </IconButton>
          </Stack>
          <AppNavigationList
            onNavigate={closeMobileDrawer}
            onAuthOpen={onAuthOpen}
            onLogout={() => {
              logout()
              navigate('/')
            }}
          />
        </Box>
      </Drawer>
    </>
  )
})
