import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import GlobalSnackbar from './components/layout/GlobalSnackbar'
import MainLayout from './components/layout/MainLayout'
import BookingTrustGate from './components/layout/BookingTrustGate'
import HostTrustGate from './components/layout/HostTrustGate'
import ProtectedRoute from './components/layout/ProtectedRoute'
import BookingPage from './pages/BookingPage'
import CarDetailPage from './pages/CarDetailPage'
import ChatPage from './pages/ChatPage'
import CompleteProfilePage from './pages/CompleteProfilePage'
import DashboardPage from './pages/DashboardPage'
import HostDashboardPage from './pages/HostDashboardPage'
import HostInvitePage from './pages/HostInvitePage'
import LandingPage from './pages/LandingPage'
import MapPage from './pages/MapPage'
import NotificationsPage from './pages/NotificationsPage'
import SearchPage from './pages/SearchPage'
import VehicleModelSearchPage from './pages/VehicleModelSearchPage'
import LegalPrivacyPage from './pages/legal/LegalPrivacyPage'
import LegalTermsPage from './pages/legal/LegalTermsPage'
import TrustOnboardingPage from './pages/TrustOnboardingPage'
import VerifyIdentityPage from './pages/VerifyIdentityPage'

function NotFoundPage() {
  return <Navigate to="/" replace />
}

/** Remount per vehicle so trip dates re-sync from `useSearchStore` (list filters) on each open. */
function CarDetailRoute() {
  const { id } = useParams()
  return <CarDetailPage key={id} />
}

export default function App() {
  return (
    <>
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
