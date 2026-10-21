// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  testMatch: /.*\.spec\.js$/,
  fullyParallel: true,
  workers: 4,
  retries: 0,
  forbidOnly: true,
  timeout: 30000,
  reporter: [['list']],
  use: {
    viewport: { width: 1280, height: 900 },
    trace: 'off'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 900 } } },
    // The WebKit build for Windows stalls when several pages run at once on
    // one machine, so its tests run one at a time.
    { name: 'webkit', workers: 1, use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 900 } } }
  ]
});
