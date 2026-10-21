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
    const testLogs: string[] = [];
    const networkFailures: Array<{ timestamp: string; method: string; url: string; error: string }> = [];
    const isVerbose = !!process.env.VERBOSE || !!process.env.DEBUG_LOGS;

    const logEvent = (level: string, message: string) => {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] [${level}] ${message}`;
      testLogs.push(line);
      if (isVerbose) {
        console.log(`  ${line}`);
      }
    };

    // Log top-level navigation
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        logEvent('NAVIGATE', frame.url());
      }
    });

    // Log backend API calls
    page.on('request', req => {
      if (req.url().includes('/api/') || req.url().includes('localhost') || req.url().includes('127.0.0.1')) {
        logEvent('HTTP REQ', `${req.method()} ${req.url()}`);
      }
    });

    page.on('response', res => {
      if (res.url().includes('/api/') || res.url().includes('localhost') || res.url().includes('127.0.0.1')) {
        logEvent('HTTP RES', `${res.status()} ${res.url()}`);
      }
    });

    // Capture browser console logs with ISO timestamps
    page.on('console', msg => {
      logEvent(`CONSOLE ${msg.type().toUpperCase()}`, msg.text());
    });

    // Capture uncaught page errors with stack traces
    page.on('pageerror', err => {
      logEvent('PAGE ERROR', err.stack || err.message);
    });

    // Capture failed network requests
    page.on('requestfailed', req => {
      const timestamp = new Date().toISOString();
      const failure = {
        timestamp,
        method: req.method(),
        url: req.url(),
        error: req.failure()?.errorText || 'Unknown error'
      };
      networkFailures.push(failure);
      logEvent('NET FAILED', `${failure.method} ${failure.url} (${failure.error})`);
    });

    try {
      await use(page);
    } finally {
      // Always append to logs/e2e-run.log on disk
      try {
        const logsDir = path.resolve(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        const block = `=== [${new Date().toISOString()}] ${testInfo.title} (${testInfo.status.toUpperCase()}) ===\n` +
          (testLogs.length > 0 ? testLogs.join('\n') : '[Brak zarejestrowanych zdarzeń konsoli]') + '\n\n';
        fs.appendFileSync(path.join(logsDir, 'e2e-run.log'), block);
      } catch (err) {
        console.error('Error writing log file:', err);
      }

      // If test failed or VERBOSE is requested, attach detailed diagnostic artifacts to Playwright report
      const shouldAttachArtifacts = (testInfo.status !== testInfo.expectedStatus) || isVerbose;

      if (shouldAttachArtifacts) {
        // 1. Browser console log dump
        if (testLogs.length > 0) {
          await testInfo.attach('browser-console.log', {
            body: testLogs.join('\n'),
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
