import { describe, expect, it } from 'vitest'

import { listingShareSocialUrls, listingShareUrl } from './listingShare'

describe('listingShareUrl', () => {
  it('joins origin, Vite base, and car id', () => {
    expect(listingShareUrl('car_001', 'https://rentahub2026.github.io', '/')).toBe(
      'https://rentahub2026.github.io/cars/car_001',
    )
    expect(listingShareUrl('car_001', 'https://example.com', '/app/')).toBe(
      'https://example.com/app/cars/car_001',
    )
  })
})

describe('listingShareSocialUrls', () => {
  it('builds encoded WhatsApp, Facebook, X, Telegram, and email links', () => {
    const url = 'https://rentahub2026.github.io/cars/car_001'
    const text = '2023 Toyota Fortuner in Makati'
    const hrefs = listingShareSocialUrls(url, text, 'Share listing')
    expect(hrefs.whatsapp).toContain('wa.me')
    expect(hrefs.whatsapp).toContain(encodeURIComponent(url))
    expect(hrefs.facebook).toContain('facebook.com/sharer')
    expect(hrefs.facebook).toContain(encodeURIComponent(url))
    expect(hrefs.x).toContain('twitter.com/intent/tweet')
    expect(hrefs.telegram).toContain('t.me/share')
    expect(hrefs.email.startsWith('mailto:')).toBe(true)
    expect(hrefs.email).toContain('Share%20listing')
  })
})
