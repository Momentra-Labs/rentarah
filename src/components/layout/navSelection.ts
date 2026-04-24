import type { AuthUser } from '../../types'

const sp = (search: string) => new URLSearchParams(search)

export function isDashboardPath(pathname: string) {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}

export function isHostPath(pathname: string) {
  return pathname === '/host' || pathname.startsWith('/host/')
}

export function isNotificationsPath(pathname: string) {
  return pathname === '/notifications' || pathname.startsWith('/notifications/')
}

/**
 * Resolve `selected` for sidebar `NavRow` so links that share a pathname stay mutually exclusive
 * (e.g. /dashboard?nav=trips vs /dashboard, /host?section=list vs /host).
 */
export function resolveNavItemSelected(
  key: string,
  pathname: string,
  _hash: string,
  search: string,
  user: AuthUser | null,
): boolean {
  const q = sp(search)
  const nav = q.get('nav')
  const section = q.get('section')

  switch (key) {
    case 'browse':
      return (
        pathname.startsWith('/search') && (q.get('vt') == null || q.get('vt') === '')
      )
    case 'home':
      return pathname === '/' || pathname === ''
    case 'host-invite':
      return pathname === '/become-a-host'
    case 'map':
      return pathname === '/map'
    case 'list':
      return isHostPath(pathname) && section === 'list'
    case 'my-trips':
      return isDashboardPath(pathname) && nav === 'trips'
    case 'notifications':
      return isNotificationsPath(pathname)
    case 'dashboard':
      return isDashboardPath(pathname) && nav !== 'trips'
    case 'host-dash':
      return Boolean(
        user && user.isHost && isHostPath(pathname) && section !== 'list',
      )
    default:
      return false
  }
}
