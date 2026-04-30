import { lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { notifyAppReady } from './webview/nativeBridge'
import GlobalSnackbar from './components/layout/GlobalSnackbar'
import MainLayout from './components/layout/MainLayout'
import BookingTrustGate from './components/layout/BookingTrustGate'
import HostTrustGate from './components/layout/HostTrustGate'
import ProtectedRoute from './components/layout/ProtectedRoute'

import LandingPage from './pages/LandingPage'

const BookingPage = lazy(() => import('./pages/BookingPage'))
const CarDetailPage = lazy(() => import('./pages/CarDetailPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const HostDashboardPage = lazy(() => import('./pages/HostDashboardPage'))
const HostInvitePage = lazy(() => import('./pages/HostInvitePage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const VehicleModelSearchPage = lazy(() => import('./pages/VehicleModelSearchPage'))
const LegalPrivacyPage = lazy(() => import('./pages/legal/LegalPrivacyPage'))
const LegalTermsPage = lazy(() => import('./pages/legal/LegalTermsPage'))
const TrustOnboardingPage = lazy(() => import('./pages/TrustOnboardingPage'))
const VerifyIdentityPage = lazy(() => import('./pages/VerifyIdentityPage'))

function NotFoundPage() {
  return <Navigate to="/" replace />
}

/** Remount per vehicle so trip dates re-sync from `useSearchStore` (list filters) on each open. */
function CarDetailRoute() {
  const { id } = useParams()
  return <CarDetailPage key={id} />
}

function WebViewShellHooks() {
  useEffect(() => {
    notifyAppReady()
  }, [])
  return null
}

export default function App() {
  return (
    <>
      <WebViewShellHooks />
      <GlobalSnackbar />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/model" element={<VehicleModelSearchPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/become-a-host" element={<HostInvitePage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/trust-onboarding" element={<TrustOnboardingPage />} />
          <Route path="/verify-identity" element={<VerifyIdentityPage />} />
          <Route path="/legal/terms" element={<LegalTermsPage />} />
          <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
          <Route path="/cars/:id" element={<CarDetailRoute />} />
          <Route
            path="/booking/:carId"
            element={
              <ProtectedRoute>
                <BookingTrustGate>
                  <BookingPage />
                </BookingTrustGate>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host"
            element={
              <ProtectedRoute>
                <HostTrustGate>
                  <HostDashboardPage />
                </HostTrustGate>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:threadId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
