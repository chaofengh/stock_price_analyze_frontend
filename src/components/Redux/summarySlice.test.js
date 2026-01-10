import summaryReducer, { fetchSummary } from './summarySlice';

describe('summarySlice', () => {
  const baseState = summaryReducer(undefined, { type: 'init' });

  it('marks the symbol as error after a rejected fetch without chart data', () => {
    const pendingState = summaryReducer(
      baseState,
      fetchSummary.pending('req-1', 'AAPL')
    );

    const rejectedAction = {
      type: fetchSummary.rejected.type,
      payload: 'Server error',
      meta: { arg: 'AAPL' },
    };

    const nextState = summaryReducer(pendingState, rejectedAction);

    expect(nextState.loading).toBe(false);
    expect(nextState.error).toBe('Server error');
    expect(nextState.data).toEqual({ symbol: 'AAPL' });
  });

  it('keeps existing chart data when a refresh fails for the same symbol', () => {
    const stateWithData = {
      ...baseState,
      data: {
        symbol: 'AAPL',
        chart_data: [{ date: '2024-01-02', close: 101.0 }],
      },
      loading: true,
    };

    const rejectedAction = {
      type: fetchSummary.rejected.type,
      payload: 'Server error',
      meta: { arg: 'AAPL' },
    };

    const nextState = summaryReducer(stateWithData, rejectedAction);

    expect(nextState.data.chart_data).toHaveLength(1);
    expect(nextState.data.symbol).toBe('AAPL');
    expect(nextState.error).toBe('Server error');
  });
});
