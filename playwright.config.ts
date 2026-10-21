const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './e2e/specs',
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker avoids extension profile lock

  // Reporter strategy: List for terminal, HTML for visual inspection, JSON for data dumps
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/summary.json' }]
  ],

  outputDir: 'test-results',

  use: {
    // Feature 3: Full Diagnostic Data Collection on Failure
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
