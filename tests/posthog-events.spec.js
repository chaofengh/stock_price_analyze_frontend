const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL.replace(/\/+$/, '')}/api`;
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || 'https://us.i.posthog.com';

const buildSummaryPayload = (symbol) => ({
  symbol,
  chart_data: [
    { date: '2024-01-02', close: 100, upper: 112, lower: 92 },
    { date: '2024-02-02', close: 105, upper: 114, lower: 94 },
  ],
  final_price: 105,
  price_change_in_dollars: 5,
  window_5: { upper_touch_pullbacks: [], lower_touch_bounces: [] },
});

const buildWatchlistPayload = (symbols) => Object.fromEntries(
  symbols.map((symbol) => [
    symbol,
    {
      candles: [{ open: 100, close: 106, volume: 1000 }],
      summary: { close: 106, open: 100, previousClose: 98, volume: 1000 },
    },
  ])
);

const buildAlertsPayload = () => ({
  timestamp: '2025-01-01T00:00:00Z',
  alerts: [],
});

const parsePosthogPayload = (postData) => {
  if (!postData) return [];
  let parsed;
  try {
    parsed = JSON.parse(postData);
  } catch {
    const params = new URLSearchParams(postData);
    const data = params.get('data');
    if (data) {
      try {
        const decoded = Buffer.from(data, 'base64').toString('utf8');
        parsed = JSON.parse(decoded);
      } catch {
        parsed = null;
      }
    }
  }
  if (!parsed) return [];
  if (Array.isArray(parsed.batch)) return parsed.batch;
  if (Array.isArray(parsed.events)) return parsed.events;
  if (parsed.event) return [parsed];
  return [];
};

const installPosthogCollector = async (page, { featureFlags } = {}) => {
  const events = [];
  const host = new URL(POSTHOG_HOST).hostname;
  await page.route(`**${host}**`, async (route) => {
    const request = route.request();
    const url = request.url();
    if (request.method() === 'POST') {
      const captured = parsePosthogPayload(request.postData());
      captured.forEach((event) => events.push(event));
    }
    if (url.includes('/decide') || url.includes('/flags')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ featureFlags: featureFlags || {} }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  const waitForEvent = async (name, predicate) => {
    let match;
    await expect.poll(() => {
      match = events.find(
        (event) =>
          event?.event === name &&
          (!predicate || predicate(event?.properties || {}))
      );
      return Boolean(match);
    }).toBeTruthy();
    return match;
  };

  return { events, waitForEvent };
};

const installApiMocks = async (page, { alertsPayload } = {}) => {
  const watchlist = new Set();
  const alerts = alertsPayload || buildAlertsPayload();

  await page.route(`${API_BASE}/world-markets**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ as_of: '2025-01-01T00:00:00Z', markets: [] }),
    });
  });

  await page.route(`${API_BASE}/summary/bundle**`, async (route) => {
    const url = new URL(route.request().url());
    const symbol = url.searchParams.get('symbol') || 'AAPL';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildSummaryPayload(symbol)),
    });
  });

  await page.route(`${API_BASE}/summary/overview**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
  await page.route(`${API_BASE}/summary/peers**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route(`${API_BASE}/summary/fundamentals**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
  await page.route(`${API_BASE}/summary/peer-averages**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  await page.route(`${API_BASE}/tickers/**/logo`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ logo_base64: '' }),
    });
  });

  await page.route(`${API_BASE}/tickers`, async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildWatchlistPayload([...watchlist])),
      });
      return;
    }
    if (method === 'POST') {
      try {
        const body = JSON.parse(request.postData() || '{}');
        if (body?.ticker) watchlist.add(String(body.ticker).toUpperCase());
      } catch {
        // ignore malformed payloads
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      return;
    }
    if (method === 'DELETE') {
      try {
        const body = JSON.parse(request.postData() || '{}');
        if (body?.ticker) watchlist.delete(String(body.ticker).toUpperCase());
      } catch {
        // ignore malformed payloads
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      return;
    }
    await route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({}) });
  });

  await page.route(`${API_BASE}/alerts/latest`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(alerts),
    });
  });

  await page.route('**/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'test-token',
        refreshToken: 'test-refresh',
        user: { id: 123, email: 'test@example.com', username: 'tester' },
      }),
    });
  });

  await page.route('**/register', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'test-token',
        refreshToken: 'test-refresh',
        user: { id: 123, email: 'test@example.com', username: 'tester' },
      }),
    });
  });

  await page.route('**/finnhub.io/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: [{ symbol: 'AAPL', description: 'Apple Inc' }],
      }),
    });
  });
};

test('captures watchlist empty-state experiment events', async ({ page }) => {
  await installApiMocks(page);
  const { waitForEvent } = await installPosthogCollector(page, {
    featureFlags: { exp_watchlist_suggestions_empty_state: 'test' },
  });

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 321, email: 'demo@example.com', username: 'demo' }));
  });

  await page.goto('/watchlist');

  await waitForEvent(
    'watchlist_empty_state_viewed',
    (props) =>
      props.flag_key === 'exp_watchlist_suggestions_empty_state' &&
      props.suggestions_enabled === true
  );

  await page.getByRole('button', { name: 'AAPL' }).click();

  await waitForEvent('watchlist_suggestion_clicked', (props) => props.symbol === 'AAPL');
  await waitForEvent('watchlist_ticker_added', (props) =>
    props.symbol === 'AAPL' && props.method === 'suggestion'
  );
});
