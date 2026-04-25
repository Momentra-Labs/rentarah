import { Box, useMediaQuery, useTheme } from '@mui/material'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import LoadingScreen from '../brand/LoadingScreen'
import AuthDialog from '../auth/AuthDialog'
import OnboardingFlow from '../onboarding/OnboardingFlow'
import { AppNavSidebar } from './AppNavigationList'
import Footer from './Footer'
import MobileBottomNav, { MOBILE_BOTTOM_NAV_SX_PB } from './MobileBottomNav'
import Navbar from './Navbar'
import { pageMotionTransition, pageMotionVariants } from './pageMotion'
import { useVehicles } from '../../hooks/useVehicles'
import { useAuthStore } from '../../store/useAuthStore'
import { useBookingStore } from '../../store/useBookingStore'
import { useCarsStore } from '../../store/useCarsStore'
import { useChatStore } from '../../store/useChatStore'
import { useSearchStore } from '../../store/useSearchStore'
import type { AuthLocationState } from '../../types/authFlow'

/** Short beat so the brand mark registers without blocking return visits. */
const MIN_LOADING_SCREEN_MS = 800

/** Easing: fast start, gentle settle as the sheet clears the viewport */
const loadingExitEase = [0.33, 1, 0.68, 1] as const

export default function MainLayout() {
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const lightRouteMotion = Boolean(reduceMotion || isMobile)
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const bookings = useBookingStore((s) => s.bookings)
  const syncThreadsFromBookings = useChatStore((s) => s.syncThreadsFromBookings)
  const [authOpen, setAuthOpen] = useState(false)
  const [authDialogDefaultTab, setAuthDialogDefaultTab] = useState<'login' | 'register'>('login')
  const [minSplashElapsed, setMinSplashElapsed] = useState(false)
  /** Survives re-renders: after auth, continue reserve → checkout if set. */
  const pendingBookCarIdRef = useRef<string | null>(null)

  /** Boots the shared vehicle catalog (mock or API) for all routes. */
  const { isLoading: vehiclesLoading } = useVehicles()

  useEffect(() => {
    const id = window.setTimeout(() => setMinSplashElapsed(true), MIN_LOADING_SCREEN_MS)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (user) syncThreadsFromBookings(bookings)
  }, [user, bookings, syncThreadsFromBookings])

  const showLoadingScreen = vehiclesLoading || !minSplashElapsed

  const handleLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const handleAuthOpen = useCallback(() => {
    setAuthDialogDefaultTab('login')
    setAuthOpen(true)
  }, [])

  const handleAuthClose = useCallback(() => {
    setAuthOpen(false)
    setAuthDialogDefaultTab('login')
    pendingBookCarIdRef.current = null
  }, [])

  /** Open auth from navigation state (e.g. Reserve while logged out) without losing the URL. */
  useEffect(() => {
    const st = location.state as AuthLocationState | undefined
    if (!st?.auth) return
    if (st.pendingBookCarId) pendingBookCarIdRef.current = st.pendingBookCarId
    setAuthDialogDefaultTab(st.authTab === 'register' ? 'register' : 'login')
    setAuthOpen(true)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
  }, [location.pathname, location.search, location.state, navigate])

  const handleAuthenticated = useCallback(() => {
    const carId = pendingBookCarIdRef.current
    pendingBookCarIdRef.current = null
    if (!carId) return
    const car = useCarsStore.getState().cars.find((c) => c.id === carId)
    const pickup = useSearchStore.getState().pickup
    const dropoff = useSearchStore.getState().dropoff
    if (car && pickup?.isValid() && dropoff?.isValid()) {
      useBookingStore.getState().initBooking(car, pickup, dropoff)
      navigate(`/booking/${carId}`)
    }
  }, [navigate])

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
              pb: {
                xs: MOBILE_BOTTOM_NAV_SX_PB,
                sm: MOBILE_BOTTOM_NAV_SX_PB,
                md: 'max(12px, env(safe-area-inset-bottom))',
              },
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageMotionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={
                  lightRouteMotion
                    ? { duration: 0.12, ease: 'easeOut' as const }
                    : pageMotionTransition
                }
                style={{ minHeight: '100%' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
      <Footer onAuthOpen={handleAuthOpen} />
      <MobileBottomNav onAuthOpen={handleAuthOpen} />
      <AuthDialog
        open={authOpen}
        onClose={handleAuthClose}
        onAuthenticated={handleAuthenticated}
        defaultTab={authDialogDefaultTab}
      />
      {!showLoadingScreen ? <OnboardingFlow /> : null}
    </Box>
  )
}
