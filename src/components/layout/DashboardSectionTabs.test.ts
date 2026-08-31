import { describe, expect, it } from 'vitest'

import { DASHBOARD_MORE_TAB_VALUE, resolveDashboardTabsValue } from './DashboardSectionTabs'

const PRIMARY = ['trips', 'saved'] as const

describe('resolveDashboardTabsValue', () => {
  it('keeps the current key on the full strip', () => {
    expect(resolveDashboardTabsValue('reviews', PRIMARY, false)).toBe('reviews')
    expect(resolveDashboardTabsValue('trips', PRIMARY, false)).toBe('trips')
  })

  it('keeps primary keys selected on the compact strip', () => {
    expect(resolveDashboardTabsValue('trips', PRIMARY, true)).toBe('trips')
    expect(resolveDashboardTabsValue('saved', PRIMARY, true)).toBe('saved')
  })

  it('selects More when the current section is overflowed', () => {
    expect(resolveDashboardTabsValue('past', PRIMARY, true)).toBe(DASHBOARD_MORE_TAB_VALUE)
    expect(resolveDashboardTabsValue('reviews', PRIMARY, true)).toBe(DASHBOARD_MORE_TAB_VALUE)
    expect(resolveDashboardTabsValue('profile', PRIMARY, true)).toBe(DASHBOARD_MORE_TAB_VALUE)
  })
})
