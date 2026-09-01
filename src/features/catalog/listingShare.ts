/** Canonical public URL for a listing (origin + Vite base + `/cars/:id`). */
export function listingShareUrl(carId: string, origin: string, baseUrl = '/'): string {
  const base = (baseUrl || '/').replace(/\/$/, '')
  const path = `${base}/cars/${encodeURIComponent(carId)}`
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function listingShareSocialUrls(url: string, text: string, subject: string) {
  const u = encodeURIComponent(url)
  const body = encodeURIComponent(`${text} ${url}`.trim())
  return {
    whatsapp: `https://wa.me/?text=${body}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`,
  }
}

export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* fall through */
    }
  }
  if (typeof document === 'undefined') return false
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export async function shareWithWebApi(payload: { title: string; text: string; url: string }): Promise<'shared' | 'cancelled' | 'unavailable'> {
  if (!canUseWebShare()) return 'unavailable'
  try {
    await navigator.share(payload)
    return 'shared'
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    return 'unavailable'
  }
}
