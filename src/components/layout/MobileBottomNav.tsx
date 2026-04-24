import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import LoginOutlined from '@mui/icons-material/LoginOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/useAuthStore'

export const MOBILE_BOTTOM_NAV_SX_PB =
  'max(12px, calc(56px + env(safe-area-inset-bottom, 0px)))'

type MobileBottomNavProps = {
  onAuthOpen?: () => void
}

function tabIndexForPath(pathname: string): number {
  if (pathname === '/' || pathname === '') return 0
  if (pathname.startsWith('/search')) return 1
  if (pathname === '/map') return 2
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/host') ||
    pathname.startsWith('/notifications')
  )
    return 3
  return -1
}

export default function MobileBottomNav({ onAuthOpen }: MobileBottomNavProps) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)

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
      }}
    >
      <BottomNavigation
        showLabels
        value={value < 0 ? false : value}
        onChange={(_e, newValue: number | false) => {
          if (newValue === false) return
          if (newValue === 0) navigate('/')
          else if (newValue === 1) navigate('/search')
          else if (newValue === 2) navigate('/map')
          else if (newValue === 3) {
            if (user) navigate('/dashboard')
            else onAuthOpen?.()
          }
        }}
      >
        <BottomNavigationAction label="Home" icon={<HomeOutlined />} />
        <BottomNavigationAction label="Browse" icon={<SearchOutlined />} />
        <BottomNavigationAction label="Map" icon={<MapOutlined />} />
        <BottomNavigationAction
          label={user ? 'Account' : 'Sign in'}
          icon={user ? <AccountCircleOutlined /> : <LoginOutlined />}
        />
      </BottomNavigation>
    </Paper>
  )
}
