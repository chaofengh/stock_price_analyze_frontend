const getSummaryApiRoot = () =>
  process.env.REACT_APP_summary_root_api || 'http://localhost:5000/api';

const entryDecisionCache = new Map();
const entryDecisionInFlight = new Map();

const buildEntryDecisionKey = (symbol, asOfDate) =>
  `${String(symbol || '').toUpperCase()}|${asOfDate || ''}`;

export async function fetchStockSummary(symbol) {
  const apiRoot = getSummaryApiRoot();
  const response = await fetch(
    `${apiRoot}/summary?symbol=${symbol}`,
    { cache: 'no-store' }
  );
  if (!response.ok) {
    let message = response.statusText || response.status;
    try {
      const errorBody = await response.json();
      message = errorBody?.error || message;
    } catch {
      // keep statusText fallback
    }
    throw new Error(`Server error: ${message}`);
  }
  return response.json();
}

export async function fetchStockOverview(symbol) {
  const apiRoot = getSummaryApiRoot();
  const response = await fetch(`${apiRoot}/summary/overview?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockPeers(symbol) {
  const apiRoot = getSummaryApiRoot();
  const response = await fetch(`${apiRoot}/summary/peers?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockFundamentals(symbol) {
  const apiRoot = getSummaryApiRoot();
  const response = await fetch(`${apiRoot}/summary/fundamentals?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockPeerAverages(symbol) {
  const apiRoot = getSummaryApiRoot();
  const response = await fetch(`${apiRoot}/summary/peer-averages?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockEntryDecision(symbol, asOfDate, options = {}) {
  const cacheKey = buildEntryDecisionKey(symbol, asOfDate);
  const cached = entryDecisionCache.get(cacheKey);
  if (!options.forceRefresh && cached) {
    return cached.payload;
  }

  if (!options.forceRefresh && entryDecisionInFlight.has(cacheKey)) {
    return entryDecisionInFlight.get(cacheKey);
  }

  const apiRoot = getSummaryApiRoot();
  const params = new URLSearchParams({ symbol });
  if (asOfDate) {
    params.set('as_of_date', asOfDate);
  }
  const requestPromise = fetch(
    `${apiRoot}/summary/entry-decision?${params.toString()}`,
    {
      cache: 'force-cache',
      signal: options.signal,
    }
  )
    .then(async (response) => {
      if (!response.ok) {
        let message = response.statusText || response.status;
        try {
          const errorBody = await response.json();
          message = errorBody?.error || message;
        } catch {
          // keep statusText fallback
        }
        throw new Error(`Server error: ${message}`);
      }
      const payload = await response.json();
      entryDecisionCache.set(cacheKey, {
        payload,
      });
      return payload;
    })
    .finally(() => {
      entryDecisionInFlight.delete(cacheKey);
    });

  entryDecisionInFlight.set(cacheKey, requestPromise);
  return requestPromise;
}

export function __resetStockServiceCaches() {
  entryDecisionCache.clear();
  entryDecisionInFlight.clear();
}

export async function fetchCashFlowData(symbol) {
  const apiRoot = getSummaryApiRoot();
  const response = await fetch(`${apiRoot}/financials/cash_flow/${symbol}`);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export async function fetchBalanceSheetData(symbol) {
  const apiRoot = getSummaryApiRoot();
  const response = await fetch(`${apiRoot}/financials/balance_sheet/${symbol}`);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export async function fetchIncomeStatementData(symbol) {
  const apiRoot = getSummaryApiRoot();
  const response = await fetch(`${apiRoot}/financials/income_statement/${symbol}`);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export async function fetchWorldMarketMoves({ refresh = true } = {}) {
  const apiRoot = getSummaryApiRoot();
  const endpoint = refresh
    ? `${apiRoot}/world-markets?refresh=1`
    : `${apiRoot}/world-markets`;
  const response = await fetch(endpoint, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}
