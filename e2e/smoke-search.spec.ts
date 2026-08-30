import { test, expect } from '@playwright/test'

/**
 * Critical-path smoke: landing → search.
 * Requires `@playwright/test` (see playwright.config.ts).
 */
test.describe('browse smoke', () => {
  test('home loads and search is reachable', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /search|browse|explore/i }).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
