// @ts-check
const { defineConfig } = require('@playwright/test');

const useRealEnv = process.env.PLAYWRIGHT_USE_REAL_ENV === '1';
/**
 * Playwright's webServer.env expects { [key: string]: string }.
 * Node's process.env is { [key: string]: string | undefined }, so we filter out undefined values.
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ [key: string]: string }}
 */
const sanitizeEnv = (env) =>
  Object.fromEntries(
    Object.entries(env).filter(([, value]) => typeof value === 'string')
  );
const webEnv = sanitizeEnv(process.env);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

if (!useRealEnv) {
  const base = baseURL.replace(/\/+$/, '');
  webEnv.REACT_APP_summary_root_api =
    process.env.REACT_APP_summary_root_api || `${base}/api`;
  webEnv.REACT_APP_POSTHOG_HOST =
    process.env.REACT_APP_POSTHOG_HOST || 'https://us.i.posthog.com';
  webEnv.REACT_APP_POSTHOG_KEY =
    process.env.REACT_APP_POSTHOG_KEY || 'phc_test';
  webEnv.REACT_APP_Finnhub_API_Key =
    process.env.REACT_APP_Finnhub_API_Key || 'test';
}

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {
    timeout: 12_000,
  },
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: 'npm run start -- --port 3000',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: webEnv,
      },
});
