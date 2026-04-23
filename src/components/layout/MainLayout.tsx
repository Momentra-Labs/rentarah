import { Box, useTheme } from '@mui/material'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import LoadingScreen from '../brand/LoadingScreen'
import AuthDialog from '../auth/AuthDialog'
import { AppNavSidebar } from './AppNavigationList'
import Footer from './Footer'
import Navbar from './Navbar'
import { pageMotionTransition, pageMotionVariants } from './pageMotion'
import { useVehicles } from '../../hooks/useVehicles'
import { useAuthStore } from '../../store/useAuthStore'

/** Minimum time the branded loader stays up so the animation is noticeable (ms). */
const MIN_LOADING_SCREEN_MS = 2500

/** Easing: fast start, gentle settle as the sheet clears the viewport */
const loadingExitEase = [0.33, 1, 0.68, 1] as const

export default function MainLayout() {
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [authOpen, setAuthOpen] = useState(false)
  const [minSplashElapsed, setMinSplashElapsed] = useState(false)

  /** Boots the shared vehicle catalog (mock or API) for all routes. */
  const { isLoading: vehiclesLoading } = useVehicles()

  useEffect(() => {
    const id = window.setTimeout(() => setMinSplashElapsed(true), MIN_LOADING_SCREEN_MS)
    return () => window.clearTimeout(id)
  }, [])

  const showLoadingScreen = vehiclesLoading || !minSplashElapsed

  const handleLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const handleAuthOpen = useCallback(() => setAuthOpen(true), [])

  const handleAuthClose = useCallback(() => setAuthOpen(false), [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AnimatePresence>
        {showLoadingScreen ? (
          <motion.div
            key="app-loading-screen"
            initial={false}
            animate={{ y: 0, x: 0, opacity: 1 }}
            exit={
              reduceMotion
                ? {
                    opacity: 0,
                    transition: { duration: 0.22, ease: 'easeOut' },
                  }
                : {
                    y: '-100%',
                    x: '-5%',
                    opacity: 1,
                    transition: { duration: 0.52, ease: loadingExitEase },
                  }
            }
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: theme.zIndex.modal + 2,
              willChange: 'transform',
            }}
          >
            <LoadingScreen />
          </motion.div>
        ) : null}
      </AnimatePresence>
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
