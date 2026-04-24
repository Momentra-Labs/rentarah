import MapOutlined from '@mui/icons-material/MapOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import MyLocation from '@mui/icons-material/MyLocation'
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import {
  AppBar,
  Avatar,
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
import { useCallback, useEffect, useRef, useState, type MouseEventHandler } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import RentaraLogoMark from '../brand/RentaraLogoMark'
import NotificationPanelContent from '../notifications/NotificationPanelContent'
import AppNavigationList from './AppNavigationList'
import GeolocationShareDialog from './GeolocationShareDialog'
import { useAuthStore } from '../../store/useAuthStore'
import { useGeolocationStore } from '../../store/useGeolocationStore'
import { useNotificationStore, useUnreadNotificationCount } from '../../store/useNotificationStore'

export type NavbarProps = {
  onAuthOpen: () => void
}

export default function Navbar({ onAuthOpen }: NavbarProps) {
  const theme = useTheme()
  const isMd = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

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

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (isMd) setNotifEl(null)
  }, [isMd])

  useEffect(() => {
    setNotifEl(null)
  }, [location.pathname])

  const notifAria = `Notifications${unread > 0 ? `, ${unread} unread` : ''}`

  return (
    <>
      <AppBar
        position="sticky"
        elevation={elevated ? 2 : 0}
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          borderBottom: elevated ? 'none' : '1px solid',
          borderColor: 'divider',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        <Toolbar sx={{ width: '100%', mx: 'auto', px: { xs: 2, md: 2.5 }, minHeight: { xs: 56, md: 64 } }}>
          <Stack
            direction="row"
            alignItems="center"
            component={RouterLink}
            to="/"
            className="rentara-brand-lockup"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              mr: 'auto',
              display: { xs: 'flex', md: 'none' },
              py: 0.5,
              px: 0.5,
              borderRadius: 2,
              transition: 'background-color 0.2s ease, transform 0.22s ease-in-out',
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
              '@media (hover: hover)': {
                '&:hover': { transform: 'scale(1.02)' },
              },
            }}
          >
            <RentaraLogoMark size="sm" variant="navLockup" showTextFallback />
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
              sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Map
            </Button>
          </Stack>

          {!isMd &&
            (!user ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  onClick={() => openGeoDialog()}
                  aria-label={geoActive ? 'Location sharing is on. Open location settings' : 'Share your location for maps'}
                  sx={{ minWidth: 44, minHeight: 44, color: geoActive ? 'primary.main' : 'action.active' }}
                >
                  <MyLocation fontSize="small" />
                </IconButton>
                <Button variant="text" onClick={() => onAuthOpen()} sx={{ fontWeight: 600 }}>
                  Sign In
                </Button>
                <Button variant="contained" onClick={() => onAuthOpen()} sx={{ fontWeight: 600, borderRadius: 2, px: 2.5 }}>
                  Get Started
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  onClick={() => openGeoDialog()}
                  aria-label={geoActive ? 'Location sharing is on. Open location settings' : 'Share your location for maps'}
                  sx={{ minWidth: 44, minHeight: 44, color: geoActive ? 'primary.main' : 'action.active' }}
                >
                  <MyLocation fontSize="small" />
                </IconButton>
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
                  aria-label="Open account menu"
                  sx={{ ml: 0 }}
                >
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>{user.avatar}</Avatar>
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
                >
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/notifications')
                    }}
                  >
                    Notifications
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/dashboard?nav=trips')
                    }}
                  >
                    My Trips
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/dashboard')
                    }}
                  >
                    Dashboard
                  </MenuItem>
                  {!user.isHost && (
                    <MenuItem
                      onClick={() => {
                        setAnchor(null)
                        navigate('/host')
                      }}
                    >
                      Become a Host
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/host')
                    }}
                  >
                    Host Dashboard
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      logout()
                      navigate('/')
                    }}
                  >
                    Sign Out
                  </MenuItem>
                </Menu>
              </Stack>
            ))}

          {isMd && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 'auto' }}>
              <IconButton
                onClick={() => openGeoDialog()}
                aria-label={geoActive ? 'Location sharing is on. Open location settings' : 'Share your location for maps'}
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
                aria-label="Open navigation menu"
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
            Menu
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
}
