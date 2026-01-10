import { fetchStockSummary } from './StockService';

describe('fetchStockSummary', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.REACT_APP_summary_root_api;

  beforeEach(() => {
    process.env.REACT_APP_summary_root_api = 'http://example.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.REACT_APP_summary_root_api = originalEnv;
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('returns data and uses no-store cache', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ symbol: 'AAPL' }),
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
      json: jest.fn().mockResolvedValue({ error: 'boom' }),
    });

    await expect(fetchStockSummary('AAPL')).rejects.toThrow('Server error: boom');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
