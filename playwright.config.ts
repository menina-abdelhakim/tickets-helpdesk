import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  // Reseeds the database so every run starts from a known state.
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Locally: start (or reuse) the dev server. In CI the workflow has already
  // run `npm run build`, so test the production output instead of dev.
  webServer: {
    command: process.env.CI ? 'npm start' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
