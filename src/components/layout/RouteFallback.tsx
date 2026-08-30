import { useLocation } from 'react-router-dom'

import BookingPageSkeleton from '@/components/skeletons/BookingPageSkeleton'
import BrowsePageSkeleton from '@/components/skeletons/BrowsePageSkeleton'
import CarDetailSkeleton from '@/components/skeletons/CarDetailSkeleton'
import ChatPageSkeleton from '@/components/skeletons/ChatPageSkeleton'
import DashboardPageSkeleton from '@/components/skeletons/DashboardPageSkeleton'
import FormPageSkeleton from '@/components/skeletons/FormPageSkeleton'
import HostDashboardPageSkeleton from '@/components/skeletons/HostDashboardPageSkeleton'
import MapPageSkeleton from '@/components/skeletons/MapPageSkeleton'
import NotificationsPageSkeleton from '@/components/skeletons/NotificationsPageSkeleton'

export type RouteFallbackKind =
  | 'browse'
  | 'detail'
  | 'map'
  | 'dashboard'
  | 'host'
  | 'chat'
  | 'notifications'
  | 'booking'
  | 'form'

export function routeFallbackKind(pathname: string): RouteFallbackKind {
  if (pathname.startsWith('/search')) return 'browse'
  if (pathname.startsWith('/cars/')) return 'detail'
  if (pathname.startsWith('/map')) return 'map'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/host')) return 'host'
  if (pathname.startsWith('/messages')) return 'chat'
  if (pathname.startsWith('/notifications')) return 'notifications'
  if (pathname.startsWith('/booking')) return 'booking'
  return 'form'
}

/**
 * `Suspense` fallback. Each lazy route uses a layout-matching skeleton so the
 * outlet does not collapse to a thin bar while the chunk loads.
 */
export default function RouteFallback() {
  const { pathname } = useLocation()
  const kind = routeFallbackKind(pathname)

  if (kind === 'browse') return <BrowsePageSkeleton />
  if (kind === 'detail') return <CarDetailSkeleton />
  if (kind === 'map') return <MapPageSkeleton />
  if (kind === 'dashboard') return <DashboardPageSkeleton />
  if (kind === 'host') return <HostDashboardPageSkeleton />
  if (kind === 'chat') return <ChatPageSkeleton />
  if (kind === 'notifications') return <NotificationsPageSkeleton />
  if (kind === 'booking') return <BookingPageSkeleton />

  if (pathname.startsWith('/become-a-host')) {
    return <FormPageSkeleton label="Loading host invite" />
  }
  if (pathname.startsWith('/complete-profile')) {
    return <FormPageSkeleton label="Loading profile" />
  }
  if (pathname.startsWith('/trust-onboarding')) {
    return <FormPageSkeleton label="Loading onboarding" />
  }
  if (pathname.startsWith('/verify-identity')) {
    return <FormPageSkeleton label="Loading verification" />
  }
  if (pathname.startsWith('/legal')) {
    return <FormPageSkeleton label="Loading legal page" />
  }

  return <FormPageSkeleton />
}
