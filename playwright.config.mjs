import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.EXPO_WEB_PORT || '8081';
const baseURL = process.env.EXPO_WEB_BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    screenshot: 'on',
    trace: 'on',
    video: 'on',
  },
  webServer: {
    command: `env -u NO_COLOR npx expo start --web --port ${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    url: baseURL,
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['iPhone 14'],
        browserName: 'chromium',
      },
    },
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { height: 900, width: 1280 },
      },
    },
  ],
});
