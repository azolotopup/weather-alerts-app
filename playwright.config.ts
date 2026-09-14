import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: '.tools/playwright-results',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3100'
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 375, height: 812 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: 'bun src/index.ts',
    url: 'http://localhost:3100',
    env: {
      NODE_ENV: 'production',
      PORT: '3100',
      BUN_PUBLIC_WSAPI_URL: 'https://weather.test',
    },
    reuseExistingServer: !process.env.CI,
  },
});
