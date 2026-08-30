import { describe, expect, it } from 'vitest'

import { interpolate, isAppLocale, lookupMessage, translate } from './translate'
import { en } from './en'
import { fil } from './fil'

describe('translate', () => {
  it('looks up nested English and Filipino keys', () => {
    expect(lookupMessage(en, 'nav.home')).toBe('Home')
    expect(lookupMessage(fil, 'nav.home')).toBe('Home')
    expect(translate('fil', 'nav.signIn')).toBe('Mag-sign in')
    expect(translate('en', 'nav.signIn')).toBe('Sign In')
  })

  it('interpolates placeholders', () => {
    expect(interpolate('Hi, {{name}}', { name: 'Carlo' })).toBe('Hi, Carlo')
    expect(translate('en', 'renter.greeting', { name: 'Ana' })).toBe('Hi, Ana')
    expect(translate('fil', 'host.nextPendingOther', { count: 3 })).toContain('3')
  })

  it('accepts only supported locales', () => {
    expect(isAppLocale('en')).toBe(true)
    expect(isAppLocale('fil')).toBe(true)
    expect(isAppLocale('es')).toBe(false)
  })

  it('uses Filipino dayjs locale name', async () => {
    const { dayjsLocale } = await import('./translate')
    expect(dayjsLocale('fil')).toBe('fil')
    expect(dayjsLocale('en')).toBe('en')
  })
})
