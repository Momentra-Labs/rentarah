import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import LoginOutlined from '@mui/icons-material/LoginOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import { Badge, BottomNavigation, BottomNavigationAction, Box, Paper } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/useAuthStore'
import { useChatUnreadForCurrentUser } from '../../store/useChatStore'
import type { AuthUser } from '../../types'

/**
 * Vertical space the fixed bar occupies from the bottom of the viewport, including the
 * raised Map button (see BottomNavigationAction below). 72px was too small in practice; the
 * bubble can extend well above the 68px row, so this stays conservative.
 */
export const MOBILE_TAB_BAR_INSET_PX = 160

export const MOBILE_BOTTOM_NAV_SX_PB = `max(12px, calc(${MOBILE_TAB_BAR_INSET_PX}px + env(safe-area-inset-bottom, 0px)))`

/** Added only to the footer’s bottom padding (in addition to {@link MOBILE_TAB_BAR_INSET_PX}). */
export const MOBILE_FOOTER_ADDITIONAL_CLEAR_PX = 88

/**
 * Fixed `bottom` for corner FABs (search filter, list map, host add, landing map) where the
 * mobile tab bar is shown. Uses only the ~68px bar row + safe area + a small gap — not the
 * full {@link MOBILE_TAB_BAR_INSET_PX} (that reserve is for scroll content / map bubble center).
 */
const MOBILE_TAB_BAR_ROW_CLEAR_PX = 72
export const MOBILE_TAB_BAR_FAB_BOTTOM = `max(20px, calc(${MOBILE_TAB_BAR_ROW_CLEAR_PX}px + env(safe-area-inset-bottom, 0px) + 10px))`

type MobileBottomNavProps = {
  onAuthOpen?: () => void
}

function tabIndexForPath(pathname: string, user: AuthUser | null): number {
  if (user) {
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
  if (pathname === '/' || pathname === '') return 0
  if (pathname.startsWith('/search')) return 1
  if (pathname === '/map') return 2
  if (pathname.startsWith('/become-a-host')) return 3
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/host') || pathname.startsWith('/notifications'))
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

  const value = tabIndexForPath(pathname, user)

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
            if (user) {
              if (newValue === 0) navigate('/')
              else if (newValue === 1) navigate('/search')
              else if (newValue === 2) navigate('/map')
              else if (newValue === 3) navigate('/messages')
              else if (newValue === 4) navigate('/dashboard')
            } else {
              if (newValue === 0) navigate('/')
              else if (newValue === 1) navigate('/search')
              else if (newValue === 2) navigate('/map')
              else if (newValue === 3) navigate('/become-a-host')
              else if (newValue === 4) onAuthOpen?.()
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
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: 3,
                  /** Less lift than -2.75 so the bubble encroaches less on scrollable content. */
                  mt: -2,
                  mb: 0.25,
                  border: 2,
                  borderColor: 'background.paper',
                }}
              >
                <MapOutlined sx={{ fontSize: 26 }} />
              </Box>
            }
            sx={(t) => ({
              color: 'text.secondary',
              minWidth: 64,
              '&.Mui-selected': { color: t.palette.primary.main },
            })}
          />
          {user ? (
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
          ) : (
            <BottomNavigationAction
              label="Host"
              icon={<StorefrontOutlined fontSize="small" />}
            />
          )}
          <BottomNavigationAction
            label={user ? 'Account' : 'Sign in'}
            icon={user ? <AccountCircleOutlined fontSize="small" /> : <LoginOutlined fontSize="small" />}
          />
        </BottomNavigation>
      </Box>
    </Paper>
  )
}
