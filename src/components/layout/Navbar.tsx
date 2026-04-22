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
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import AuthDialog from '../auth/AuthDialog'
import { useAuthStore } from '../../store/useAuthStore'

export default function Navbar() {
  const theme = useTheme()
  const isMd = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [elevated, setElevated] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
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
      setAuthOpen(true)
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
    }
  }, [location, navigate])

  const links = (
    <>
      <Button component={RouterLink} to="/search" color="inherit">
        Browse Cars
      </Button>
      <Button color="inherit" component="a" href="#how">
        How it Works
      </Button>
      <Button component={RouterLink} to="/host" color="inherit">
        List Your Car
      </Button>
    </>
  )

  return (
    <>
      <AppBar
        position="sticky"
        elevation={elevated ? 4 : 0}
        sx={{
          bgcolor: '#FFFFFF',
          color: 'text.primary',
          borderBottom: elevated ? 'none' : '1px solid',
          borderColor: 'divider',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={1} component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit', mr: 3 }}>
            <DirectionsCar sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h6" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800 }}>
              rentaHub
            </Typography>
          </Stack>

          {!isMd && (
            <Stack direction="row" spacing={1} flex={1}>
              {links}
            </Stack>
          )}

          <Box flex={1} />

          {!isMd && (!user ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button variant="text" onClick={() => setAuthOpen(true)}>
                Sign In
              </Button>
              <Button variant="contained" onClick={() => setAuthOpen(true)}>
                Get Started
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {!user.isHost && (
                <Button variant="text" component={RouterLink} to="/host">
                  Become a Host
                </Button>
              )}
              <Button variant="text" component={RouterLink} to="/dashboard">
                My Trips
              </Button>
              <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>{user.avatar}</Avatar>
              </IconButton>
              <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                <MenuItem
                  onClick={() => {
                    setAnchor(null)
                    navigate('/dashboard')
                  }}
                >
                  Dashboard
                </MenuItem>
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
              aria-label="menu"
              edge="end"
              sx={{
                ml: 1,
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
        PaperProps={{ sx: { width: { xs: 'min(100vw - 48px, 320px)', sm: 280 } } }}
      >
        <Box sx={{ width: '100%', pt: 2, pb: `max(16px, env(safe-area-inset-bottom))` }} role="navigation">
          <List dense={false}>
            <ListItemButton component={RouterLink} to="/search" onClick={() => setMobileOpen(false)}>
              <ListItemText primaryTypographyProps={{ sx: { py: 0.25 } }} primary="Browse Cars" />
            </ListItemButton>
            <ListItemButton
              component={RouterLink}
              to={{ pathname: '/', hash: '#how' }}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primaryTypographyProps={{ sx: { py: 0.25 } }} primary="How it Works" />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/host" onClick={() => setMobileOpen(false)}>
              <ListItemText primaryTypographyProps={{ sx: { py: 0.25 } }} primary="List Your Car" />
            </ListItemButton>
            {!user ? (
              <>
                <ListItemButton onClick={() => { setMobileOpen(false); setAuthOpen(true) }}>
                  <ListItemText primaryTypographyProps={{ sx: { py: 0.25 } }} primary="Sign In" />
                </ListItemButton>
                <ListItemButton onClick={() => { setMobileOpen(false); setAuthOpen(true) }}>
                  <ListItemText primaryTypographyProps={{ sx: { py: 0.25 } }} primary="Get Started" />
                </ListItemButton>
              </>
            ) : (
              <>
                {!user.isHost && (
                  <ListItemButton component={RouterLink} to="/host" onClick={() => setMobileOpen(false)}>
                    <ListItemText primaryTypographyProps={{ sx: { py: 0.25 } }} primary="Become a Host" />
                  </ListItemButton>
                )}
                <ListItemButton component={RouterLink} to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <ListItemText primaryTypographyProps={{ sx: { py: 0.25 } }} primary="My Trips" />
                </ListItemButton>
                <ListItemButton component={RouterLink} to="/host" onClick={() => setMobileOpen(false)}>
                  <ListItemText primaryTypographyProps={{ sx: { py: 0.25 } }} primary="Host dashboard" />
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false)
                    logout()
                  }}
                >
                  <ListItemText primary="Sign Out" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
