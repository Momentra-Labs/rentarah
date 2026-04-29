import { Navigate, useLocation } from 'react-router-dom'

import { isAuthProfileComplete } from '../../lib/authProfile'

import { useAuthStore } from '../../store/useAuthStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  if (!isAuthProfileComplete(user)) {
    const back = `${location.pathname}${location.search}`
    return <Navigate to="/complete-profile" replace state={{ from: back }} />
  }

  return <>{children}</>
}
