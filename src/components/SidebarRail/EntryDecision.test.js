import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import EntryDecision from './EntryDecision';
import { fetchStockEntryDecision } from '../../API/StockService';

vi.mock('../../API/StockService', () => ({
  fetchStockEntryDecision: vi.fn(),
}));

const mockPayload = {
  symbol: 'AAPL',
  requested_as_of_date: '2026-04-14',
  as_of_date: '2026-04-14',
  date_was_snapped: false,
  touched_side: 'Lower',
  setup_type: 'lower_band_mean_reversion',
  enter_today: true,
  reversion_probability: 0.67,
  continuation_probability: 0.33,
  expected_return_to_target_atr: 0.84,
  expected_adverse_move_atr: 1.0,
  confidence_score: 74,
  stage_a: {
    is_favorable: true,
    probability: 0.62,
    threshold: 0.55,
    event_risk_blocked: false,
    contributions: [],
  },
  stage_b: {
    entry_probability: 0.67,
    threshold: 0.58,
    contributions: [],
  },
  top_reasons: [
    {
      stage: 'stage_b',
      feature: 'wick_rejection',
      impact: 'good_entry',
      value: 0.4,
      contribution: 0.8,
    },
  ],
  backtest_1y: {
    period_start: '2025-04-15',
    period_end: '2026-04-15',
    sample_count: 30,
    correct_count: 19,
    accuracy: 0.633333,
    reverse_call_count: 11,
    continue_call_count: 19,
    reverse_precision: 0.545454,
    continue_precision: 0.684211,
    tp_reverse: 6,
    fp_reverse: 5,
    tn_reverse: 13,
    fn_reverse: 6,
    flat_count: 1,
    recent_predictions: [],
  },
};

describe('EntryDecision', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders success payload with key decision fields and accuracy section', async () => {
    fetchStockEntryDecision.mockResolvedValue(mockPayload);

    render(
      <MemoryRouter initialEntries={['/entry-decision?symbol=AAPL']}>
        <EntryDecision />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Two-Stage Entry Decision')).toBeInTheDocument();
      expect(screen.getByText('Enter Today: YES')).toBeInTheDocument();
      expect(screen.getByText('Setup: Lower Band Mean Reversion')).toBeInTheDocument();
      expect(screen.getByText('1Y Prediction Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Top Reasons')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
    });

    expect(fetchStockEntryDecision).toHaveBeenCalledWith(
      'AAPL',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );
  });

  it('refetches when date picker changes and shows snap chip', async () => {
    fetchStockEntryDecision
      .mockResolvedValueOnce(mockPayload)
      .mockResolvedValueOnce({
        ...mockPayload,
        requested_as_of_date: '2026-04-13',
        as_of_date: '2026-04-10',
        date_was_snapped: true,
      });

    render(
      <MemoryRouter initialEntries={['/entry-decision?symbol=AAPL']}>
        <EntryDecision />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetchStockEntryDecision).toHaveBeenCalledTimes(1));

    const input = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    fireEvent.change(input, { target: { value: '2026-04-13' } });

    await waitFor(() => {
      expect(fetchStockEntryDecision).toHaveBeenCalledTimes(2);
      expect(fetchStockEntryDecision).toHaveBeenLastCalledWith('AAPL', '2026-04-13');
      expect(screen.getByText('Snapped To Previous Trading Day')).toBeInTheDocument();
    });
  });

  it('renders API error state', async () => {
    fetchStockEntryDecision.mockRejectedValue(new Error('Server error: boom'));

    render(
      <MemoryRouter initialEntries={['/entry-decision?symbol=AAPL']}>
        <EntryDecision />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Server error: boom')).toBeInTheDocument();
    });
  });

  it('shows active-symbol-only prompt when symbol is missing', () => {
    render(
      <MemoryRouter initialEntries={['/entry-decision']}>
        <EntryDecision />
      </MemoryRouter>
    );

    expect(
      screen.getByText('This page is active-symbol only. Open a ticker and return here.')
    ).toBeInTheDocument();
    expect(fetchStockEntryDecision).not.toHaveBeenCalled();
  });
});
