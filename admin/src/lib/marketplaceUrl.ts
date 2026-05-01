/** Public marketplace origin for “open listing” links (e.g. `http://localhost:5173` or prod URL). */
export function marketplaceCarUrl(carId: string): string {
  const raw =
    ((import.meta.env.VITE_MARKETPLACE_ORIGIN as string | undefined)?.trim()) ||
    (typeof window !== 'undefined' ? `${window.location.protocol}//localhost:5173` : '')
  const base = raw.replace(/\/$/, '')
  return `${base}/cars/${encodeURIComponent(carId)}`
}
