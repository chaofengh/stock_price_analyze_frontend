'StockService.js'
const stock_summary_api_key = process.env.REACT_APP_summary_root_api;

export async function fetchStockSummary(symbol) {
    const response = await fetch(`${stock_summary_api_key}/summary?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }
    return response.json();
  }

export async function fetchStockOverview(symbol) {
  const response = await fetch(`${stock_summary_api_key}/summary/overview?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockPeers(symbol) {
  const response = await fetch(`${stock_summary_api_key}/summary/peers?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockFundamentals(symbol) {
  const response = await fetch(`${stock_summary_api_key}/summary/fundamentals?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockPeerAverages(symbol) {
  const response = await fetch(`${stock_summary_api_key}/summary/peer-averages?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCashFlowData(symbol) {
  const response = await fetch(`${stock_summary_api_key}/financials/cash_flow/${symbol}`);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export async function fetchBalanceSheetData(symbol) {
  const response = await fetch(`${stock_summary_api_key}/financials/balance_sheet/${symbol}`);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export async function fetchIncomeStatementData(symbol) {
  const response = await fetch(`${stock_summary_api_key}/financials/income_statement/${symbol}`);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export async function fetchWorldMarketMoves() {
  const response = await fetch(`${stock_summary_api_key}/world-markets`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
}
