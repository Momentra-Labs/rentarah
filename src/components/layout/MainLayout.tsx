import { Box } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import AuthDialog from '../auth/AuthDialog'
import { AppNavSidebar } from './AppNavigationList'
import Footer from './Footer'
import Navbar from './Navbar'
import { pageMotionTransition, pageMotionVariants } from './pageMotion'
import { useVehicles } from '../../hooks/useVehicles'
import { useAuthStore } from '../../store/useAuthStore'

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [authOpen, setAuthOpen] = useState(false)

  /** Boots the shared vehicle catalog (mock or API) for all routes. */
  useVehicles()

  const handleLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const handleAuthOpen = useCallback(() => setAuthOpen(true), [])

  const handleAuthClose = useCallback(() => setAuthOpen(false), [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', alignItems: 'stretch' }}>
        <AppNavSidebar onAuthOpen={handleAuthOpen} onLogout={handleLogout} />
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Navbar onAuthOpen={handleAuthOpen} />
          <Box
            component="main"
            sx={{
              flex: 1,
              width: '100%',
              pb: { xs: 'max(12px, env(safe-area-inset-bottom))', sm: 0 },
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageMotionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageMotionTransition}
                style={{ minHeight: '100%' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
      <Footer />
      <AuthDialog open={authOpen} onClose={handleAuthClose} />
    </Box>
  )
}
