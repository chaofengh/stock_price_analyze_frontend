const { test } = require('@playwright/test');

const TECH_TICKERS = [
  'SNOW',
  'WMT',
  'XYZ',
  'AMZN',
  'ABNB',
  'BBY',
  'GS',
  'INTC',
  'ZM',
  'NOW',
  'ORCL',
  'MCD',
  'META',
  'MU',
  'NFLX',
  'NVDL',
  'PLTR',
  'QQQ',
  'QCOM',
  'TSLA',
  'UBER',
  'UNH',
  'GOOGL',
  'RIVN',
  'WDC',
  'MET',
  'RBLX',
  'MS',
  'NTAP',
  'DELL',
  'BABA',
  'SHOP',
  'SPOT',
  'SSO',
  'HD',
  'PINS',
  'V',
  'AAPL',
  'AVGO',
  'DIS',
  'TQQQ',
  'ADBE',
  'AMD',
  'COST',
  'CRM',
  'MSFT',
  'NVDA',
  'CRWD',
  'TGT',
  'JPM',
  'LULU',
  'PYPL',
  'SBUX',
  'T',
];
const SUGGESTION_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'];

const PROB_LEAVE_AFTER_SEARCH = Number(process.env.PROB_LEAVE_AFTER_SEARCH || 0.1);
const PROB_SKIP_AUTH_AFTER_WATCHLIST = Number(process.env.PROB_SKIP_AUTH_AFTER_WATCHLIST || 0.5);
const PROB_OPEN_ALERT_AFTER_WATCHLIST = Number(process.env.PROB_OPEN_ALERT_AFTER_WATCHLIST || 0.9);

const USERS_TO_SIMULATE = Number(process.env.POSTHOG_SIM_USERS || 500);
const ALERT_WAIT_MS = Number(process.env.ALERT_WAIT_MS || 20000);
const ALERT_MAX_EMPTY_CHECKS = Number(process.env.ALERT_MAX_EMPTY_CHECKS || 3);
const REQUIRE_REAL_BACKEND =
  process.env.PLAYWRIGHT_USE_REAL_ENV === '1' || process.env.SIM_USE_REAL_BACKEND === '1';
const POSTHOG_FLUSH_WAIT_MS = Number(process.env.POSTHOG_FLUSH_WAIT_MS || 2000);
const LOG_POSTHOG_NETWORK = process.env.LOG_POSTHOG_NETWORK === '1';
const LOG_POSTHOG_DIAGNOSTICS = process.env.LOG_POSTHOG_DIAGNOSTICS === '1';

const pickRandom = (values) => values[Math.floor(Math.random() * values.length)];
const chance = (probability) => Math.random() < probability;
const jitter = (minMs, maxMs) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(minMs + Math.random() * (maxMs - minMs)))
  );

const isPosthogUrl = (url) => /posthog\.com/i.test(url);
const maskToken = (token) => {
  if (!token) return null;
  const str = String(token);
  if (str.length <= 10) return '[redacted]';
  return `${str.slice(0, 4)}…${str.slice(-4)}`;
};

const attachPosthogNetworkLogging = (page) => {
  if (!LOG_POSTHOG_NETWORK) return;

  page.on('request', (req) => {
    if (!isPosthogUrl(req.url())) return;
    console.log('[posthog] request', req.method(), req.url());
  });
  page.on('requestfailed', (req) => {
    if (!isPosthogUrl(req.url())) return;
    console.warn('[posthog] request failed', req.failure()?.errorText, req.url());
  });
  page.on('response', (res) => {
    if (!isPosthogUrl(res.url())) return;
    console.log('[posthog] response', res.status(), res.url());
  });
};

const waitForPosthogReady = async (page, timeoutMs = 30000) => {
  // In this app we expose window.__posthog via PostHogProvider.loaded (non-prod only).
  // Prefer that over window.posthog, which may not be defined depending on bundling.
  try {
    await page.waitForFunction(() => {
      const ph = window.__posthog || window.posthog;
      const token = ph?.config?.token;
      return Boolean(ph && token && typeof ph.capture === 'function');
    }, { timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
};

const logPosthogConfig = async (page) => {
  if (!LOG_POSTHOG_DIAGNOSTICS) return;
  try {
    const cfg = await page.evaluate(() => {
      const ph = window.__posthog || window.posthog;
      return {
        exists: Boolean(ph),
        type: typeof ph,
        keys: ph ? Object.keys(ph).slice(0, 20) : [],
        token: ph?.config?.token ?? null,
        api_host: ph?.config?.api_host ?? null,
        distinct_id: ph?.get_distinct_id?.() ?? null,
        opted_out: ph?.has_opted_out_capturing?.() ?? null,
        consent: ph?.get_explicit_consent_status?.() ?? null,
        is_capturing: ph?.is_capturing?.() ?? null,
        is_bot: ph?._is_bot?.() ?? null,
        webdriver: typeof navigator !== 'undefined' ? Boolean(navigator.webdriver) : null,
        capture_type: typeof ph?.capture,
      };
    });
    console.log('[posthog] config', {
      ...cfg,
      token: maskToken(cfg.token),
    });
  } catch {
    // ignore
  }
};

const flushPosthog = async (page, timeoutMs = POSTHOG_FLUSH_WAIT_MS) => {
  // posthog-js may batch events and send them async. There's no public `flush()` in posthog-js,
  // so we just pause briefly to reduce the chance of closing before the browser sends requests.
  // Give the browser a moment to send queued requests.
  if (timeoutMs > 0) {
    try {
      await page.waitForTimeout(timeoutMs);
    } catch {
      // ignore
    }
  }
};

const waitForBackendResponse = async (
  page,
  { urlPart, method, timeoutMs = 20000 } = {}
) => {
  if (!urlPart) throw new Error('waitForBackendResponse: missing urlPart');
  return page.waitForResponse(
    (res) => {
      if (!res.url().includes(urlPart)) return false;
      if (method && res.request().method() !== method) return false;
      return res.status() >= 200 && res.status() < 400;
    },
    { timeout: timeoutMs }
  );
};

const waitForSummaryBundle = async (page, symbol, { timeoutMs = 25000 } = {}) => {
  const normalized = String(symbol || '').trim().toUpperCase();
  if (!normalized) return null;
  return page.waitForResponse(
    (res) => {
      if (!res.url().includes('/summary/bundle')) return false;
      if (res.request().method() !== 'GET') return false;
      if (res.status() < 200 || res.status() >= 400) return false;
      try {
        const url = new URL(res.url());
        const q = (url.searchParams.get('symbol') || '').trim().toUpperCase();
        return q === normalized;
      } catch {
        return false;
      }
    },
    { timeout: timeoutMs }
  );
};

const searchTicker = async (page, ticker) => {
  const searchInput = page.getByPlaceholder(/Search symbol/i);
  await searchInput.click();
  await searchInput.fill(ticker);
  await Promise.all([
    waitForSummaryBundle(page, ticker).catch(() => null),
    searchInput.press('Enter'),
  ]);
};

const maybeAddSuggestedTicker = async (page) => {
  for (const ticker of SUGGESTION_TICKERS) {
    const chip = page.getByRole('button', { name: ticker }).first();
    const visible = await chip.isVisible().catch(() => false);
    if (!visible) continue;
    await Promise.all([
      waitForBackendResponse(page, { urlPart: '/tickers', method: 'POST', timeoutMs: 25000 }).catch(
        () => null
      ),
      chip.click(),
    ]);
    await waitForBackendResponse(page, { urlPart: '/tickers', method: 'GET', timeoutMs: 25000 }).catch(
      () => null
    );
    await jitter(400, 900);
    await closeFirstTickerDialogIfVisible(page);
    return true;
  }
  return false;
};

const openWatchlist = async (page) => {
  await Promise.all([
    page.waitForURL('**/watchlist', { timeout: 20000 }).catch(() => null),
    page.getByLabel(/Watch list/i).click(),
  ]);
};

const openAuthDialog = async (page, mode) => {
  await page.evaluate((authMode) => {
    window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: authMode } }));
  }, mode);
};

const waitForWatchlistReady = async (page, timeoutMs = 30000) => {
  try {
    await page.getByLabel('Add a ticker', { exact: true }).waitFor({ timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
};

const loginAccount = async (page, { emailOrUsername, password }) => {
  await openAuthDialog(page, 'login');
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder(/Email or username/i).waitFor({ timeout: 20000 });

  await dialog.getByPlaceholder(/Email or username/i).fill(emailOrUsername);
  await dialog.getByPlaceholder(/^Password$/i).fill(password);

  await Promise.all([
    waitForBackendResponse(page, { urlPart: '/login', method: 'POST', timeoutMs: 30000 }).catch(
      () => null
    ),
    dialog.getByRole('button', { name: /Log In/i }).click(),
  ]);

  await waitForBackendResponse(page, { urlPart: '/tickers', method: 'GET', timeoutMs: 30000 }).catch(
    () => null
  );

  return waitForWatchlistReady(page, 30000);
};

const registerAccount = async (page, userSeed) => {
  await openAuthDialog(page, 'register');

  const dialog = page.getByRole('dialog');
  // Avoid strict-mode collisions: the dialog contains multiple headings with similar text.
  await dialog.getByRole('textbox', { name: /^Email$/i }).waitFor({ timeout: 20000 });

  const email = `posthog+${userSeed}@example.com`;
  const username = `ph_${userSeed.replace(/[^a-z0-9]/gi, '').slice(-12)}`;
  const password = `Pwd!${userSeed.slice(-6)}Aa`;

  await dialog.getByRole('textbox', { name: /^Email$/i }).fill(email);
  await dialog.getByRole('textbox', { name: /^First name$/i }).fill('Test');
  await dialog.getByRole('textbox', { name: /^Last name$/i }).fill('User');
  await dialog.getByRole('textbox', { name: /^Username$/i }).fill(username);
  await dialog.getByLabel('Password', { exact: true }).fill(password);
  await dialog.getByLabel('Confirm password', { exact: true }).fill(password);
  await dialog
    .getByRole('checkbox', { name: /I agree to the Terms & Privacy Policy/i })
    .check();

  await jitter(5200, 6800);
  await Promise.all([
    waitForBackendResponse(page, { urlPart: '/register', method: 'POST', timeoutMs: 30000 }).catch(
      () => null
    ),
    dialog.getByRole('button', { name: 'Register' }).click(),
  ]);

  // After successful auth, watchlist fetch begins.
  await waitForBackendResponse(page, { urlPart: '/tickers', method: 'GET', timeoutMs: 30000 }).catch(
    () => null
  );

  await dialog.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => null);

  const ready = await waitForWatchlistReady(page, 20000);
  if (ready) return { ok: true, email, password };

  const loggedIn = await loginAccount(page, { emailOrUsername: email, password });
  return { ok: loggedIn, email, password };
};

const closeFirstTickerDialogIfVisible = async (page) => {
  const keepGoing = page.getByRole('button', { name: 'Keep going' });
  if (await keepGoing.isVisible()) {
    await keepGoing.click();
  }
};

const addTickersToWatchlist = async (page, count) => {
  await page.getByLabel('Add a ticker', { exact: true }).waitFor({ timeout: 20000 });
  const addInput = page.getByLabel('Add a ticker', { exact: true });
  const addButton = page.getByRole('button', { name: 'ADD' });
  const selected = new Set();
  while (selected.size < count) {
    selected.add(pickRandom(TECH_TICKERS));
  }

  for (const ticker of selected) {
    await addInput.fill(ticker);
    await Promise.all([
      waitForBackendResponse(page, { urlPart: '/tickers', method: 'POST', timeoutMs: 25000 }).catch(
        () => null
      ),
      addButton.click(),
    ]);
    await waitForBackendResponse(page, { urlPart: '/tickers', method: 'GET', timeoutMs: 25000 }).catch(
      () => null
    );
    await jitter(400, 900);
    await closeFirstTickerDialogIfVisible(page);
  }
};

const openAlertAndMaybeView = async (page, shouldView) => {
  // The app only polls every 30 minutes by default. For simulations, run with
  // REACT_APP_ALERTS_POLL_MS=5000 (or similar) so /alerts/latest is refreshed.
  const notificationButton = page.locator('button', {
    has: page.locator('svg[data-testid="NotificationsIcon"]'),
  });
  let emptyChecks = 0;
  const start = Date.now();
  while (Date.now() - start < ALERT_WAIT_MS) {
    await notificationButton.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);

    const viewDetails = dialog.getByRole('button', { name: 'View Details' }).first();
    if (await viewDetails.isVisible().catch(() => false)) {
      if (shouldView) {
        await viewDetails.click();
      } else {
        await dialog.getByRole('button', { name: 'Close' }).click();
      }
      return true;
    }

    const noAlertsHeading = dialog.getByRole('heading', { name: /No Current Alerts/i }).first();
    const sawNoAlerts = await noAlertsHeading.isVisible().catch(() => false);

    const closeButton = dialog.getByRole('button', { name: 'Close' }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }

    // Edge case: Some users will never receive alerts because their watchlist tickers
    // never cross the bands. Don't hang forever waiting for something that won't happen.
    if (sawNoAlerts) {
      emptyChecks += 1;
      if (emptyChecks >= ALERT_MAX_EMPTY_CHECKS) return false;
    }

    await jitter(2500, 4500);
  }
  return false;
};

test.describe('posthog funnel simulation', () => {
  test.skip(!process.env.RUN_POSTHOG_SIM, 'Set RUN_POSTHOG_SIM=1 to run');
  test.skip(
    !REQUIRE_REAL_BACKEND,
    'Set PLAYWRIGHT_USE_REAL_ENV=1 (recommended) or SIM_USE_REAL_BACKEND=1 to use real backend responses.'
  );

  test('simulate user activity', async ({ browser }) => {
    // 500 users can take hours depending on backend latency and alert cadence.
    test.setTimeout(12 * 60 * 60 * 1000);

    for (let i = 0; i < USERS_TO_SIMULATE; i += 1) {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(20000);

      const userSeed = `${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`;
      console.log(`Simulation user ${i + 1}/${USERS_TO_SIMULATE} starting (seed=${userSeed})`);

      try {
        attachPosthogNetworkLogging(page);
        await page.goto('/');
        await jitter(400, 900);
        const ready = await waitForPosthogReady(page);
        await logPosthogConfig(page);
        if (!ready) {
          console.warn('[posthog] not ready (missing token) - check frontend .env and restart `npm start`');
        }

        const ticker = pickRandom(TECH_TICKERS);
        await searchTicker(page, ticker);
        await jitter(700, 1400);

        if (chance(PROB_LEAVE_AFTER_SEARCH)) {
          continue;
        }

        await openWatchlist(page);
        await jitter(600, 1200);

        if (chance(PROB_SKIP_AUTH_AFTER_WATCHLIST)) {
          continue;
        }

        const registration = await registerAccount(page, userSeed);
        if (!registration?.ok) {
          continue;
        }
        await jitter(500, 1100);

        await maybeAddSuggestedTicker(page);

        const tickersToAdd = Math.floor(Math.random() * 3) + 1;
        await addTickersToWatchlist(page, tickersToAdd);

        if (chance(PROB_OPEN_ALERT_AFTER_WATCHLIST)) {
          await openAlertAndMaybeView(page, true);
        } else {
          await openAlertAndMaybeView(page, false);
        }
      } catch (error) {
        console.warn(`Simulation user ${i + 1} failed`, error);
      } finally {
        await flushPosthog(page);
        await context.close();
        console.log(`Simulation user ${i + 1}/${USERS_TO_SIMULATE} finished`);
      }
    }
  });
});
