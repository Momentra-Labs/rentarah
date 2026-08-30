import { defineConfig } from '@playwright/test'

/**
 * Optional E2E scaffolding — install with:
 *   npm i -D @playwright/test && npx playwright install
 * Then: npx playwright test
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
})
