import MapOutlined from '@mui/icons-material/MapOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import MyLocation from '@mui/icons-material/MyLocation'
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import {
  AppBar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Toolbar,
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

  const notifAria = `${t('nav.notifications')}${unread > 0 ? `, ${unread}` : ''}`

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          color: 'text.primary',
          border: 'none',
          backgroundColor: theme.palette.background.default,
          backgroundImage: elevated
            ? 'linear-gradient(180deg, #D6E6FF 0%, #FFFFFF 100%)'
            : 'linear-gradient(180deg, #8FB6F5 0%, #C5DAFB 42%, #F4F8FF 78%, #FFFFFF 100%)',
          boxShadow: elevated
            ? `0 10px 24px ${alpha(theme.palette.common.black, 0.07)}`
            : 'none',
          pt: { xs: 'env(safe-area-inset-top, 0px)', md: 0 },
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            pointerEvents: 'none',
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${theme.palette.primary.main} 16%, ${alpha('#60A5FA', 1)} 50%, ${theme.palette.primary.main} 84%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
          },
        }}
      >
        <Toolbar
          sx={{
            width: '100%',
            mx: 'auto',
            px: { xs: 2, md: 2.5 },
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
              overflow: 'hidden',
              transition: 'none',
              '& [data-rentara-logo]': {
                minWidth: 0,
                height: 46,
                width: 'auto',
                maxWidth: 'none',
                objectFit: 'cover',
                objectPosition: 'left center',
              },
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
            }}
          >
            <Box sx={{ width: 46, height: 46, overflow: 'hidden', minWidth: 0, flexShrink: 0 }}>
              <RentaraLogoMark size="sm" variant="mark" showTextFallback={false} />
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            spacing={1}
            sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, pr: 1 }}
          >
            <Button
              component={RouterLink}
              to="/map"
              color="primary"
              variant="text"
              size="medium"
              startIcon={<MapOutlined />}
              onPointerDown={() => prefetchPath('/map')}
              sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              {t('nav.map')}
            </Button>
          </Stack>

          {!isMd &&
            (!user ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <LanguageSwitcher compact />
                <IconButton
                  onClick={() => openGeoDialog()}
                  aria-label={geoActive ? t('nav.geoOn') : t('nav.geoOff')}
                  sx={{ minWidth: 44, minHeight: 44, color: geoActive ? 'primary.main' : 'action.active' }}
                >
                  <MyLocation fontSize="small" />
                </IconButton>
                <Button
                  variant="text"
                  onPointerDown={() => prefetchAuthDialogChunk()}
                  onClick={() => onAuthOpen()}
                  sx={{ fontWeight: 600 }}
                >
                  {t('nav.signIn')}
                </Button>
                <Button
                  variant="contained"
                  onPointerDown={() => prefetchAuthDialogChunk()}
                  onClick={() => onAuthOpen()}
                  sx={{ fontWeight: 600, borderRadius: 2, px: 2.5 }}
                >
                  {t('nav.getStarted')}
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  onClick={() => openGeoDialog()}
                  aria-label={geoActive ? t('nav.geoOn') : t('nav.geoOff')}
                  sx={{ minWidth: 44, minHeight: 44, color: geoActive ? 'primary.main' : 'action.active' }}
                >
                  <MyLocation fontSize="small" />
                </IconButton>
                <LanguageSwitcher compact />
                <IconButton onClick={onNotificationBellClick} aria-label={notifAria} sx={{ minWidth: 44, minHeight: 44 }}>
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
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      border: 1,
                      borderColor: 'divider',
                      boxShadow: (t) => `0 4px 24px ${alpha(t.palette.common.black, 0.1)}`,
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
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/notifications')
                    }}
                  >
                    {t('nav.notifications')}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/messages')
                    }}
                  >
                    {t('nav.messages')}
                    {chatUnread > 0 ? ` (${chatUnread > 9 ? '9+' : chatUnread})` : ''}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/dashboard?nav=trips')
                    }}
                  >
                    {t('nav.myTrips')}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/dashboard?nav=profile')
                    }}
                  >
                    {t('nav.dashboard')}
                  </MenuItem>
                  {!user.isHost && (
                    <MenuItem
                      onClick={() => {
                        setAnchor(null)
                        navigate('/host')
                      }}
                    >
                      {t('nav.becomeAHost')}
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/host')
                    }}
                  >
                    {t('nav.hostDashboard')}
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      logout()
                      navigate('/')
                    }}
                  >
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
              <IconButton
                onClick={() => openGeoDialog()}
                aria-label={geoActive ? t('nav.geoOn') : t('nav.geoOff')}
                sx={{ minWidth: 44, minHeight: 44, color: geoActive ? 'primary.main' : 'action.active' }}
              >
                <MyLocation fontSize="small" />
              </IconButton>
              {user && (
                <IconButton onClick={onNotificationBellClick} aria-label={notifAria} sx={{ minWidth: 44, minHeight: 44 }}>
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
              )}
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
          elevation: 3,
          sx: {
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: 2,
            overflow: 'hidden',
            mt: 1,
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
            width: { xs: 'min(100vw - 40px, 320px)', sm: 300 },
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            borderLeft: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            pt: 2,
            pb: `max(16px, env(safe-area-inset-bottom))`,
            px: 0.5,
          }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <Typography variant="overline" sx={{ px: 2, fontWeight: 700, letterSpacing: '0.08em', color: 'primary.main' }}>
            {t('nav.menu')}
          </Typography>
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
