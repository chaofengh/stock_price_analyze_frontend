
export async function fetchStockSummary(symbol) {
    const stock_summary_api_key = process.env.REACT_APP_summary_root_api;

    console.log(`${stock_summary_api_key}`);
    const response = await fetch(`${stock_summary_api_key}=${symbol}`);
    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }
    return response.json();
  }
  