import { demoCatalog } from '../data/demoCatalog'
import type { Vehicle } from '../types/domain'

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, '')
}

/**
 * Prefer `VITE_RENTARA_API_URL` or `VITE_API_URL` (same as marketplace) + `GET /vehicles`.
 */
function resolveApiBase(): string {
  const a = import.meta.env.VITE_RENTARA_API_URL as string | undefined
  const b = import.meta.env.VITE_API_URL as string | undefined
  const raw = (a ?? b ?? '').trim()
  return stripTrailingSlash(raw)
}

export type CatalogFetchResult =
  | { source: 'api'; vehicles: Vehicle[] }
  | { source: 'demo'; vehicles: Vehicle[]; fallbackReason?: string }

export async function fetchCatalog(signal?: AbortSignal): Promise<CatalogFetchResult> {
  const base = resolveApiBase()
  if (!base) {
    return { source: 'demo', vehicles: demoCatalog.map((v) => ({ ...v })) }
  }

  const url = `${base}/vehicles`
  try {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) {
      return {
        source: 'demo',
        vehicles: demoCatalog.map((v) => ({ ...v })),
        fallbackReason: `GET /vehicles → ${res.status} ${res.statusText}`,
      }
    }
    const data = (await res.json()) as unknown
    if (!Array.isArray(data)) {
      return {
        source: 'demo',
        vehicles: demoCatalog.map((v) => ({ ...v })),
        fallbackReason: 'API returned non-array JSON for /vehicles',
      }
    }
    return { source: 'api', vehicles: data as Vehicle[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return {
      source: 'demo',
      vehicles: demoCatalog.map((v) => ({ ...v })),
      fallbackReason: msg,
    }
  }
}
