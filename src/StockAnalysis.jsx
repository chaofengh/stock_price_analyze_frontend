import React, { useState } from 'react';
import { fetchStockSummary } from './API/StockService';

function StockAnalysis() {
  const [symbol, setSymbol] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!symbol) return;

    setLoading(true);
    setError('');
    setSummary(null);

    try {
      const data = await fetchStockSummary(symbol);
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Stock Analysis</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Stock Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <button type="submit">Analyze</button>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {summary && !loading && (
        <div>
          <h3>Summary for {summary.symbol}</h3>
          {/* Display other keys from summary */}
          <p>Price Change: {summary.price_change_in_dollars}</p>
        </div>
      )}
    </div>
  );
}

export default StockAnalysis;
