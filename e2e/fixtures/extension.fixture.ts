import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface ExtensionFixtures {
  context: BrowserContext;
  page: Page;
  extensionId: string;
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const pathToExtension = path.resolve(__dirname, '../../extension');

    // ── FEATURE 1: REPEATABILITY (Isolated Ephemeral Profile) ───────────
    // Each test execution receives a completely fresh, isolated temp profile.
    // Zero leftover cookies, zero profile locks, zero manual cleanup needed.
    const tempPrefix = path.join(os.tmpdir(), 'pw-koneczny-profile-');
    const userDataDir = fs.mkdtempSync(tempPrefix);

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
      ],
      viewport: { width: 1440, height: 900 },
    });

    try {
      await use(context);
    } finally {
      // Automatic cleanup: close context and wipe temp user data directory
      await context.close().catch(() => {});
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (e) {
        // OS transient lock guard
      }
    }
  },

  page: async ({ context }, use, testInfo) => {
    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

    // ── FEATURE 3: DIAGNOSIS & DEBUGGING (Timestamped Logs & Dumps) ─────
    const consoleLogs: string[] = [];
    const networkFailures: Array<{ timestamp: string; method: string; url: string; error: string }> = [];

    // Capture browser console logs with ISO timestamps
    page.on('console', msg => {
      const timestamp = new Date().toISOString();
      consoleLogs.push(`[${timestamp}] [CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Capture uncaught page errors with stack traces
    page.on('pageerror', err => {
      const timestamp = new Date().toISOString();
      consoleLogs.push(`[${timestamp}] [PAGE ERROR] ${err.stack || err.message}`);
    });

    // Capture failed network requests
    page.on('requestfailed', req => {
      const timestamp = new Date().toISOString();
      networkFailures.push({
        timestamp,
        method: req.method(),
        url: req.url(),
        error: req.failure()?.errorText || 'Unknown error'
      });
    });

    try {
      await use(page);
    } finally {
      // If the test failed, attach detailed diagnostic artifacts to the report
      if (testInfo.status !== testInfo.expectedStatus) {
        // 1. Browser console log dump
        if (consoleLogs.length > 0) {
          await testInfo.attach('browser-console.log', {
            body: consoleLogs.join('\n'),
            contentType: 'text/plain',
          });
        }

        // 2. Network failures structured JSON dump
        if (networkFailures.length > 0) {
          await testInfo.attach('network-failures.json', {
            body: JSON.stringify(networkFailures, null, 2),
            contentType: 'application/json',
          });
        }

        // 3. Extension Shadow DOM Snapshot dump
        try {
          const domDump = await page.evaluate(() => {
            const root = document.getElementById('koneczny-extension-root');
            if (!root) return '<!-- No #koneczny-extension-root element found in page DOM -->';
            const shadow = root.shadowRoot;
            return shadow ? shadow.innerHTML : root.outerHTML;
          });
          await testInfo.attach('extension-shadow-dom-dump.html', {
            body: domDump,
            contentType: 'text/html',
          });
        } catch (e) {
          // Fallback if page crashed
        }
      }
    }
  },

  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker', { timeout: 3000 }).catch(() => null as any);
    }
    const extensionId = background ? background.url().split('/')[2] : 'unknown';
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
