import DirectionsCar from '@mui/icons-material/DirectionsCar'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import AppNavigationList from './AppNavigationList'
import { useAuthStore } from '../../store/useAuthStore'

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
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const st = location.state as { auth?: boolean } | undefined
    if (st?.auth) {
      onAuthOpen()
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
    }
  }, [location, navigate, onAuthOpen])

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
            spacing={1}
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              mr: 'auto',
              display: { xs: 'flex', md: 'none' },
              py: 0.5,
              borderRadius: 2,
              transition: 'background-color 0.2s ease',
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
            }}
          >
            <DirectionsCar sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' }}>
              rentaHub
            </Typography>
          </Stack>

          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

          {!isMd &&
            (!user ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="text" onClick={() => onAuthOpen()} sx={{ fontWeight: 600 }}>
                  Sign In
                </Button>
                <Button variant="contained" onClick={() => onAuthOpen()} sx={{ fontWeight: 600, borderRadius: 2, px: 2.5 }}>
                  Get Started
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Open account menu" sx={{ ml: 'auto' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>{user.avatar}</Avatar>
                </IconButton>
                <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                  <MenuItem
                    onClick={() => {
                      setAnchor(null)
                      navigate('/dashboard')
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
            <IconButton
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              edge="end"
              sx={{
                ml: 'auto',
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
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
            onNavigate={() => setMobileOpen(false)}
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
