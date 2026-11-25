import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORTAL_TEST_PORT ?? 4387);
const baseURL = 'http://127.0.0.1:' + port;
const outputDir = process.env.PORTAL_TEST_ARTIFACTS ??= mkdtempSync(join(tmpdir(), 'portal-ta-mahasiswa-'));

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.mjs',
  outputDir,
  workers: 3,
  timeout: 45000,
  reporter: 'list',
  use: {
    baseURL,
    channel: process.env.PORTAL_TEST_BROWSER ?? (process.platform === 'win32' ? 'msedge' : 'chromium'),
    viewport: { width: 1440, height: 900 },
    timezoneId: 'Asia/Jakarta',
    actionTimeout: 6000,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ' + port + ' --strictPort',
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    url: baseURL,
    reuseExistingServer: false,
  },
});
