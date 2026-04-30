import { Box, useMediaQuery, useTheme } from '@mui/material'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import LoadingScreen from '../brand/LoadingScreen'
import AuthDialog from '../auth/AuthDialog'
import OnboardingFlow from '../onboarding/OnboardingFlow'
import { AppNavSidebar } from './AppNavigationList'
import Footer from './Footer'
import MobileBottomNav, { MOBILE_BOTTOM_NAV_SX_PB } from './MobileBottomNav'
import Navbar from './Navbar'
import RouteFallback from './RouteFallback'
import { pageMotionTransition, pageMotionVariants } from './pageMotion'
import { useVehicles } from '../../hooks/useVehicles'
import { useAuthStore } from '../../store/useAuthStore'
import { useBookingStore } from '../../store/useBookingStore'
import { useCarsStore } from '../../store/useCarsStore'
import { useChatStore } from '../../store/useChatStore'
import { useGeolocationStore } from '../../store/useGeolocationStore'
import { useSearchStore } from '../../store/useSearchStore'
import type { AuthLocationState } from '../../types/authFlow'
import { isAuthProfileComplete } from '../../lib/authProfile'
import { canProceedToBookingCheckout, isLegalAndSafetyOnboardingComplete } from '../../lib/trustOnboarding'

/** Short beat so the brand registers; keep tighter so repeat navigations feel snappy. */
const MIN_LOADING_SCREEN_MS = 520

/** Easing: fast start, gentle settle as the sheet clears the viewport */
const loadingExitEase = [0.33, 1, 0.68, 1] as const

export default function MainLayout() {
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const lightRouteMotion = Boolean(reduceMotion || isMobile)
  const location = useLocation()
  /** Open conversation on mobile: hide app bar and bottom tabs so the thread is full-screen. */
  const immersiveMobileMessageThread =
    isMobile && /^\/messages\/.+/.test(location.pathname)
  /** Footer is omitted on all messages routes for a cleaner chat layout (list + thread). */
  const hideFooterOnMessages = location.pathname.startsWith('/messages')
  /** Map route uses a full-viewport split layout; skipping the marketing footer frees vertical space. */
  const hideFooterOnMap = location.pathname === '/map'
  /** Bottom nav is fixed; map should extend edge-to-edge without a dead white strip from main padding. */
  const immersiveMapMobile = hideFooterOnMap

  /** On small screens only: footer is rendered inside `main` after the routed page so it sits above the fixed tab bar in scroll order. */
  const mobileFooterInMain =
    isMobile &&
    !hideFooterOnMessages &&
    !hideFooterOnMap
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const bookings = useBookingStore((s) => s.bookings)
  const syncThreadsFromBookings = useChatStore((s) => s.syncThreadsFromBookings)
  const ensureMockChatPreview = useChatStore((s) => s.ensureMockChatPreview)
  const restoreIfPermittedOnLoad = useGeolocationStore((s) => s.restoreIfPermittedOnLoad)
  const [authOpen, setAuthOpen] = useState(false)
  const [authDialogDefaultTab, setAuthDialogDefaultTab] = useState<'login' | 'register'>('login')
  const [registerAccountRolePreset, setRegisterAccountRolePreset] = useState<'renter' | 'host' | 'both' | undefined>(undefined)
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
    if (!user) return
    syncThreadsFromBookings(bookings)
    ensureMockChatPreview()
  }, [user, bookings, syncThreadsFromBookings, ensureMockChatPreview])

  /** Full reload wiped Zustand, but the browser can still have location allowed — re-fetch. */
  useEffect(() => {
    restoreIfPermittedOnLoad()
  }, [restoreIfPermittedOnLoad])

  const showLoadingScreen = vehiclesLoading || !minSplashElapsed

  const handleLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const handleAuthOpen = useCallback(() => {
    setAuthDialogDefaultTab('login')
    setRegisterAccountRolePreset(undefined)
    setAuthOpen(true)
  }, [])

  const handleAuthClose = useCallback(() => {
    setAuthOpen(false)
    setAuthDialogDefaultTab('login')
    setRegisterAccountRolePreset(undefined)
    pendingBookCarIdRef.current = null
  }, [])

  /** Open auth from navigation state (e.g. Reserve while logged out) without losing the URL. */
  useEffect(() => {
    const st = location.state as AuthLocationState | undefined
    if (!st?.auth) return
    if (st.pendingBookCarId) pendingBookCarIdRef.current = st.pendingBookCarId
    setAuthDialogDefaultTab(st.authTab === 'register' ? 'register' : 'login')
    if (st.authTab === 'register') {
      setRegisterAccountRolePreset(st.defaultAccountRole)
    } else {
      setRegisterAccountRolePreset(undefined)
    }
    setAuthOpen(true)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
  }, [location.pathname, location.search, location.state, navigate])

  const handleAuthenticated = useCallback(() => {
    const u = useAuthStore.getState().user
    const carId = pendingBookCarIdRef.current
    if (u && !isAuthProfileComplete(u)) {
      navigate('/complete-profile', {
        replace: true,
        state: {
          from: `${location.pathname}${location.search}`,
          pendingBookCarId: carId,
        },
      })
      pendingBookCarIdRef.current = null
      return
    }
    if (u && carId != null && !canProceedToBookingCheckout(u)) {
      navigate(isLegalAndSafetyOnboardingComplete(u) ? '/verify-identity' : '/trust-onboarding', {
        replace: true,
        state: {
          from: `${location.pathname}${location.search}`,
          pendingBookCarId: carId,
          intent: 'booking',
        },
      })
      pendingBookCarIdRef.current = null
      return
    }
    pendingBookCarIdRef.current = null
    if (!carId) return
    const car = useCarsStore.getState().cars.find((c) => c.id === carId)
    const pickup = useSearchStore.getState().pickup
    const dropoff = useSearchStore.getState().dropoff
    if (car && pickup?.isValid() && dropoff?.isValid()) {
      useBookingStore.getState().initBooking(car, pickup, dropoff)
      navigate(`/booking/${carId}`)
    }
  }, [navigate, location.pathname, location.search])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: '100dvh', sm: '100vh' },
        bgcolor: 'background.default',
      }}
    >
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
        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {!immersiveMobileMessageThread ? <Navbar onAuthOpen={handleAuthOpen} /> : null}
          <Box
            component="main"
            sx={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              pb: immersiveMobileMessageThread
                ? 'max(8px, env(safe-area-inset-bottom, 0px))'
                : immersiveMapMobile
                  ? {
                      /** Map is full-bleed edge-to-edge; no `12px` floor (that caused a gap under the map on desktop). */
                      xs: 'env(safe-area-inset-bottom, 0px)',
                      sm: 'env(safe-area-inset-bottom, 0px)',
                      md: 'env(safe-area-inset-bottom, 0px)',
                    }
                  : mobileFooterInMain
                    ? /** Footer clears the fixed bar; avoid stacking this reserve on top of the footer bottom padding. */
                      {
                        xs: 'max(8px, env(safe-area-inset-bottom, 0px))',
                        sm: 'max(8px, env(safe-area-inset-bottom, 0px))',
                        md: 'max(12px, env(safe-area-inset-bottom))',
                      }
                    : {
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
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                }}
              >
                <Suspense fallback={<RouteFallback />}>
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
            {mobileFooterInMain ? <Footer /> : null}
          </Box>
        </Box>
      </Box>
      {!mobileFooterInMain && !hideFooterOnMessages && !hideFooterOnMap ? <Footer /> : null}
      {!immersiveMobileMessageThread && !hideFooterOnMap ? (
        <MobileBottomNav onAuthOpen={handleAuthOpen} />
      ) : null}
      <AuthDialog
        open={authOpen}
        onClose={handleAuthClose}
        onAuthenticated={handleAuthenticated}
        defaultTab={authDialogDefaultTab}
        registerAccountRolePreset={registerAccountRolePreset}
      />
      {!showLoadingScreen ? <OnboardingFlow /> : null}
    </Box>
  )
}
