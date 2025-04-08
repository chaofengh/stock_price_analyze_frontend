// src/API/FetchCompanyLogo.js

import axios from "axios";

const stock_summary_api_key = process.env.REACT_APP_summary_root_api;

// We'll call your backend's route now
export async function fetchCompanyLogo(symbol) {
  try {
    const response = await axios.get(`${stock_summary_api_key}/tickers/${symbol}/logo`);
    // The route returns { symbol, logo_base64 }
    // Convert the Base64 string to a data URL:
    const base64 = response.data.logo_base64;
    if (!base64) return null;
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching logo for ${symbol} from backend:`, error);
    return null;
  }
}
