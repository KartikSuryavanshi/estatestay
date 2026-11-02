import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: true,
    launchOptions: { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--disable-gpu', '--disable-software-rasterizer'] }
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: false } }
  ],
  webServer: {
    command: 'node_modules/.bin/next start -H 127.0.0.1 -p 3200',
    url: 'http://127.0.0.1:3200',
    reuseExistingServer: false,
    timeout: 60_000
  }
});
