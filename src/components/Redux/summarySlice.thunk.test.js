import { configureStore } from '@reduxjs/toolkit';
import summaryReducer, { fetchSummary } from './summarySlice';
import { fetchStockSummary } from '../../API/StockService';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../API/StockService', () => ({
  fetchStockSummary: vi.fn(),
  fetchStockPeers: vi.fn(),
  fetchStockFundamentals: vi.fn(),
  fetchStockPeerAverages: vi.fn(),
}));

describe('fetchSummary thunk', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('avoids duplicate requests while a symbol is already loading', async () => {
    const store = configureStore({ reducer: { summary: summaryReducer } });
    let resolveFetch;
    const pendingPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    fetchStockSummary.mockReturnValue(pendingPromise);

    const first = store.dispatch(fetchSummary('AAPL'));
    const second = store.dispatch(fetchSummary('AAPL'));

    expect(fetchStockSummary).toHaveBeenCalledTimes(1);

    resolveFetch({ symbol: 'AAPL', chart_data: [] });
    await first;
    await second;
  });
});
