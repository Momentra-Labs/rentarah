import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import GlobalSnackbar from './components/layout/GlobalSnackbar'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import BookingPage from './pages/BookingPage'
import CarDetailPage from './pages/CarDetailPage'
import DashboardPage from './pages/DashboardPage'
import HostDashboardPage from './pages/HostDashboardPage'
import LandingPage from './pages/LandingPage'
import MapPage from './pages/MapPage'
import NotificationsPage from './pages/NotificationsPage'
import SearchPage from './pages/SearchPage'

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
          <Route path="/map" element={<MapPage />} />
          <Route path="/cars/:id" element={<CarDetailRoute />} />
          <Route
            path="/booking/:carId"
            element={
              <ProtectedRoute>
                <BookingPage />
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
                <HostDashboardPage />
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
