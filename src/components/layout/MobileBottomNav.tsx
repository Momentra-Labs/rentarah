import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import LoginOutlined from '@mui/icons-material/LoginOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import { Badge, BottomNavigation, BottomNavigationAction, Box, Paper } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/useAuthStore'
import { useChatUnreadForCurrentUser } from '../../store/useChatStore'

export const MOBILE_BOTTOM_NAV_SX_PB =
  'max(12px, calc(72px + env(safe-area-inset-bottom, 0px)))'

/** Fixed `bottom` for FABs on screens where the mobile tab bar is shown (below `md`). */
export const MOBILE_TAB_BAR_FAB_BOTTOM = `max(24px, calc(72px + env(safe-area-inset-bottom, 0px) + 16px))`

type MobileBottomNavProps = {
  onAuthOpen?: () => void
}

function tabIndexForPath(pathname: string): number {
  if (pathname === '/' || pathname === '') return 0
  if (pathname.startsWith('/search')) return 1
  if (pathname === '/map') return 2
  if (pathname.startsWith('/messages')) return 3
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/host') ||
    pathname.startsWith('/notifications')
  )
    return 4
  return -1
}

export default function MobileBottomNav({ onAuthOpen }: MobileBottomNavProps) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const chatUnread = useChatUnreadForCurrentUser()

  if (isMdUp) return null

  const value = tabIndexForPath(pathname)

  return (
    <Paper
      square
      elevation={8}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar,
        borderTop: 1,
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom, 0px)',
        displayPrint: 'none',
        overflow: 'visible',
      }}
    >
      <Box sx={{ position: 'relative', overflow: 'visible' }}>
        <BottomNavigation
          showLabels
          value={value < 0 ? false : value}
          onChange={(_e, newValue: number | false) => {
            if (newValue === false) return
            if (newValue === 0) navigate('/')
            else if (newValue === 1) navigate('/search')
            else if (newValue === 2) navigate('/map')
            else if (newValue === 3) {
              if (user) navigate('/messages')
              else onAuthOpen?.()
            } else if (newValue === 4) {
              if (user) navigate('/dashboard')
              else onAuthOpen?.()
            }
          }}
          sx={{
            height: 68,
            px: 0.5,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              maxWidth: 'none',
              py: 0.5,
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 600,
              '&.Mui-selected': { fontSize: '0.7rem' },
            },
          }}
        >
          <BottomNavigationAction label="Home" icon={<HomeOutlined fontSize="small" />} />
          <BottomNavigationAction label="Browse" icon={<SearchOutlined fontSize="small" />} />
          <BottomNavigationAction
            label="Map"
            icon={
              <Box
                component="span"
                aria-hidden
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: 3,
                  mt: -2.75,
                  mb: 0.25,
                  border: 3,
                  borderColor: 'background.paper',
                }}
              >
                <MapOutlined sx={{ fontSize: 28 }} />
              </Box>
            }
            sx={(t) => ({
              color: 'text.secondary',
              minWidth: 64,
              '&.Mui-selected': { color: t.palette.primary.main },
            })}
          />
          <BottomNavigationAction
            label="Chat"
            icon={
              <Badge
                color="error"
                badgeContent={chatUnread > 0 ? (chatUnread > 9 ? '9+' : chatUnread) : undefined}
                invisible={chatUnread === 0}
                max={99}
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16, fontWeight: 800 } }}
              >
                <Box
                  component="span"
                  sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}
                >
                  <ChatBubbleOutline fontSize="small" />
                </Box>
              </Badge>
            }
          />
          <BottomNavigationAction
            label={user ? 'Account' : 'Sign in'}
            icon={user ? <AccountCircleOutlined fontSize="small" /> : <LoginOutlined fontSize="small" />}
          />
        </BottomNavigation>
      </Box>
    </Paper>
  )
}
