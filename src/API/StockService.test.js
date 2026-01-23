import { fetchStockSummary, fetchWorldMarketMoves } from './StockService';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('fetchStockSummary', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.REACT_APP_summary_root_api;

  beforeEach(() => {
    process.env.REACT_APP_summary_root_api = 'http://example.test';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.REACT_APP_summary_root_api = originalEnv;
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns data and uses no-store cache', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ symbol: 'AAPL' }),
    });

    const data = await fetchStockSummary('AAPL');

    expect(data.symbol).toBe('AAPL');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][1].cache).toBe('no-store');
  });

  it('throws with the backend error message', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      statusText: 'INTERNAL SERVER ERROR',
      json: vi.fn().mockResolvedValue({ error: 'boom' }),
    });

    await expect(fetchStockSummary('AAPL')).rejects.toThrow('Server error: boom');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('fetchWorldMarketMoves', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.REACT_APP_summary_root_api;

  beforeEach(() => {
    process.env.REACT_APP_summary_root_api = 'http://example.test';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.REACT_APP_summary_root_api = originalEnv;
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('uses refresh endpoint with no-store cache and no cache-control header', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ markets: [] }),
    });

    const data = await fetchWorldMarketMoves();

    expect(data.markets).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe('http://example.test/world-markets?refresh=1');
    expect(global.fetch.mock.calls[0][1].cache).toBe('no-store');
    expect(global.fetch.mock.calls[0][1].headers).toBeUndefined();
  });

  it('uses non-refresh endpoint when refresh is false', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ markets: [{ id: 'DOW' }] }),
    });

    await fetchWorldMarketMoves({ refresh: false });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe('http://example.test/world-markets');
  });

  it('throws with the backend status text on failure', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      statusText: 'BAD REQUEST',
    });

    await expect(fetchWorldMarketMoves()).rejects.toThrow('Server error: BAD REQUEST');
  });
});
