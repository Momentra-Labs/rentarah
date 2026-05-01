import MenuRounded from '@mui/icons-material/MenuRounded'
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { adminDrawerWidth } from './adminNav'

export type AdminShellProps = {
  drawerItems: { label: string; path: string; icon: ReactNode }[]
}

export default function AdminShell({ drawerItems }: AdminShellProps) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const activePath = location.pathname.replace(/\/$/, '') || '/'

  const drawer = useMemo(
    () => (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            px: 2,
            py: 2.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background:
              'linear-gradient(155deg, rgba(255,255,255,0.98) 0%, rgba(241,247,255,0.96) 100%)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: '#fff',
                fontFamily: `"Urbanist", "Inter", sans-serif`,
                fontWeight: 800,
                fontSize: '0.95rem',
                display: 'grid',
                placeItems: 'center',
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              RH
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800} letterSpacing="-0.03em">
                Operations
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.35 }}>
                RentaraH control
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, px: 1 }}>
          <Typography
            variant="caption"
            sx={{ px: 1.5, py: 0.75, fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', display: 'block' }}
          >
            Navigate
          </Typography>
          <List disablePadding sx={{ px: 0.5 }}>
            {drawerItems.map((item) => {
              const selected =
                item.path === '/'
                  ? activePath === '' || activePath === '/'
                  : activePath === item.path || activePath.startsWith(`${item.path}/`)
              return (
                <ListItemButton
                  key={item.path}
                  selected={selected}
                  disableRipple
                  onClick={() => {
                    navigate(item.path)
                    setMobileOpen(false)
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.25,
                    py: 1.15,
                    pl: selected ? '11px' : '13px',
                    borderLeft: '3px solid',
                    borderColor: selected ? 'primary.main' : 'transparent',
                    bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    transition: theme.transitions.create(['background-color', 'border-color', 'padding']),
                    '&:hover': {
                      bgcolor: selected ? alpha(theme.palette.primary.main, 0.11) : alpha(theme.palette.action.hover, 0.07),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 42,
                      color: selected ? 'primary.dark' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: selected ? 750 : 600,
                      color: selected ? 'text.primary' : 'text.secondary',
                    }}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Box>

        <Box sx={{ px: 2, py: 1.5, mt: 'auto', borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha('#fff', 0.5) }}>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            {import.meta.env.MODE === 'production' ? 'Production' : 'Development'} build
          </Typography>
        </Box>
      </Box>
    ),
    [activePath, drawerItems, navigate, theme],
  )

  const drawerPaperSx = {
    boxSizing: 'border-box' as const,
    width: adminDrawerWidth,
    borderRight: '1px solid',
    borderColor: 'divider',
    bgcolor: alpha('#fafcff', 0.98),
    backgroundImage:
      'linear-gradient(175deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,1) 40%, rgba(239,246,255,0.55) 100%)',
    boxShadow: '4px 0 48px rgba(15,23,42,0.05)',
  }

  return (
    <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' }, minHeight: 0 }}>
      {!isMdUp && (
        <Box
          sx={{
            bgcolor: alpha('#FFFFFF', 0.88),
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 0.85,
            px: 1.25,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <IconButton aria-label="open navigation menu" onClick={() => setMobileOpen(true)} edge="start" size="medium">
            <MenuRounded />
          </IconButton>
          <Typography component="span" variant="subtitle2" sx={{ ml: 0.5 }}>
            Sections & tools
          </Typography>
        </Box>
      )}

      <Box component="nav" sx={{ width: { md: adminDrawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3 },
          pb: { xs: 4, md: 4 },
          pt: { xs: 2.5, md: 3 },
          maxWidth: { md: `min(1180px, calc(100vw - ${adminDrawerWidth}px))`, xs: '100%' },
          width: '100%',
          mx: { md: 0 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
