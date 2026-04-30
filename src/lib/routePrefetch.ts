/**
 * Preload lazy route chunks before navigation (hover / idle) so `Suspense` rarely shows a long stall.
 * Keys are deduped — safe to call repeatedly.
 */

const started = new Set<string>()

function once(key: string, loader: () => Promise<unknown>): void {
  if (started.has(key)) return
  started.add(key)
  void loader()
}

/** Map common paths to the same modules as `App.tsx` `lazy(() => import(...))`. */
export function prefetchPath(pathname: string): void {
  const path = (pathname.split('?')[0] ?? '').split('#')[0] ?? ''
  if (path === '/' || path === '') return

  if (path.startsWith('/search/model')) {
    once('vehicle-model-search', () => import('../pages/VehicleModelSearchPage'))
    return
  }
  if (path.startsWith('/search')) {
    once('search', () => import('../pages/SearchPage'))
    return
  }
  if (path.startsWith('/map')) {
    once('map', () => import('../pages/MapPage'))
    return
  }
  if (path.startsWith('/become-a-host')) {
    once('host-invite', () => import('../pages/HostInvitePage'))
    return
  }
  if (path.startsWith('/complete-profile')) {
    once('complete-profile', () => import('../pages/CompleteProfilePage'))
    return
  }
  if (path.startsWith('/trust-onboarding')) {
    once('trust-onboarding', () => import('../pages/TrustOnboardingPage'))
    return
  }
  if (path.startsWith('/verify-identity')) {
    once('verify-identity', () => import('../pages/VerifyIdentityPage'))
    return
  }
  if (path.startsWith('/legal/terms')) {
    once('legal-terms', () => import('../pages/legal/LegalTermsPage'))
    return
  }
  if (path.startsWith('/legal/privacy')) {
    once('legal-privacy', () => import('../pages/legal/LegalPrivacyPage'))
    return
  }
  if (path.startsWith('/cars/')) {
    once('car-detail', () => import('../pages/CarDetailPage'))
    return
  }
  if (path.startsWith('/booking/')) {
    once('booking', () => import('../pages/BookingPage'))
    return
  }
  if (path.startsWith('/dashboard')) {
    once('dashboard', () => import('../pages/DashboardPage'))
    return
  }
  if (path.startsWith('/host')) {
    once('host-dashboard', () => import('../pages/HostDashboardPage'))
    return
  }
  if (path.startsWith('/notifications')) {
    once('notifications', () => import('../pages/NotificationsPage'))
    return
  }
  if (path.startsWith('/messages')) {
    once('chat', () => import('../pages/ChatPage'))
    return
  }
}

/** Core sidebar Explore routes — prefetch as soon as the nav mounts (deduped). */
export function prefetchExploreNavChunks(): void {
  once('search', () => import('../pages/SearchPage'))
  once('map', () => import('../pages/MapPage'))
  once('host-invite', () => import('../pages/HostInvitePage'))
  once('host-dashboard', () => import('../pages/HostDashboardPage'))
}

/** Warm the routes users hit from the tab bar / primary nav (idle). */
export function prefetchPrimaryShellRoutes(): void {
  once('search', () => import('../pages/SearchPage'))
  once('map', () => import('../pages/MapPage'))
  once('car-detail', () => import('../pages/CarDetailPage'))
  once('host-invite', () => import('../pages/HostInvitePage'))
  once('chat', () => import('../pages/ChatPage'))
  once('dashboard', () => import('../pages/DashboardPage'))
}
