// Fetch company logo from Finnhub API
import axios from "axios";

// Finnhub API Key from .env file
const FINNHUB_API_KEY = process.env.REACT_APP_Finnhub_API_Key;

export async function fetchCompanyLogo (symbol){
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    return response.data.logo || null;
  } catch (error) {
    console.error(`Error fetching logo for ${symbol}:`, error);
    return null;
  }
};