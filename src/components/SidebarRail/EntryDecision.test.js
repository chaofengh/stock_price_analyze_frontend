import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import EntryDecision from './EntryDecision';
import { fetchStockEntryDecision } from '../../API/StockService';
import { __getStockChartProps } from '../Chart/StockChart';

vi.mock('../../API/StockService', () => ({
  fetchStockEntryDecision: vi.fn(),
}));

vi.mock('../Chart/StockChart', () => {
  let lastProps = null;
  return {
    default: (props) => {
      lastProps = props;
      return <div data-testid="stock-chart" data-marker-count={props.predictionMarkers?.length || 0} />;
    },
    __getStockChartProps: () => lastProps,
  };
});

const mockPayload = {
  symbol: 'AAPL',
  requested_as_of_date: '2026-04-14',
  as_of_date: '2026-04-14',
  date_was_snapped: false,
  touched_side: 'Lower',
  setup_type: 'lower_band_touch',
  prediction_threshold: 0.75,
  deployment_thresholds: {
    continuation: 0.85,
    reversal: 0.92,
  },
  context_status: { qqq: true, xlk: true },
  horizons: {
    '5d': {
      status: 'prediction',
      predicted_direction: 'reversal',
      continuation_probability: 0.14,
      reversal_probability: 0.86,
      continuation_confidence_score: 14,
      reversal_confidence_score: 86,
      continuation_validation_precision: 0.76,
      reversal_validation_precision: 0.88,
      continuation_validation_count: 13,
      reversal_validation_count: 9,
      confidence_score: 86,
      no_prediction_reason: null,
      reversal_veto_reason: null,
      deployment_quality_gate: {
        status: 'passed',
        deployment_enabled: true,
        failures: [],
      },
      analog_evidence: {
        status: 'ready',
        posterior_probability: 0.929,
        neighbor_count: 12,
      },
      playbook: {
        name: 'Adaptive Analog Signal',
        precision: 0.83,
        match_count: 12,
      },
      model: {
        training_sample_count: 24,
        continuation_training_count: 12,
        reversal_training_count: 12,
        feature_count: 116,
        candidate_count: 3,
        candidate_search_count: 5,
      },
      contributions: [
        {
          horizon: '5d',
          feature: 'wick_rejection',
          impact: 'reversal',
          value: 0.4,
          contribution: -0.8,
        },
      ],
    },
    '10d': {
      status: 'no_prediction',
      predicted_direction: null,
      continuation_probability: 0.54,
      reversal_probability: 0.46,
      continuation_confidence_score: 54,
      reversal_confidence_score: 46,
      continuation_validation_precision: 0.62,
      reversal_validation_precision: 0.5,
      continuation_validation_count: 11,
      reversal_validation_count: 4,
      confidence_score: 54,
      no_prediction_reason: 'low_confidence',
      reversal_veto_reason: 'falling_knife_no_exhaustion',
      deployment_quality_gate: {
        status: 'quarantined',
        deployment_enabled: false,
        failures: ['weak_reverse_accuracy'],
      },
      analog_evidence: {
        status: 'ready',
        posterior_probability: 0.643,
        neighbor_count: 14,
      },
      model: {
        training_sample_count: 24,
        continuation_training_count: 12,
        reversal_training_count: 12,
        feature_count: 116,
        candidate_count: 0,
        candidate_search_count: 5,
      },
      contributions: [],
    },
  },
  top_reasons: [
    {
      horizon: '5d',
      feature: 'wick_rejection',
      impact: 'reversal',
      value: 0.4,
      contribution: -0.8,
    },
  ],
  backtest_1y: {
    '5d': {
      period_start: '2025-04-15',
      period_end: '2026-04-15',
      eligible_touch_count: 30,
      prediction_count: 12,
      sample_count: 12,
      no_prediction_count: 18,
      coverage: 0.4,
      correct_count: 8,
      accuracy: 0.666667,
      continuation_call_count: 5,
      continuation_correct_count: 3,
      continuation_accuracy: 0.6,
      reversal_call_count: 7,
      reversal_correct_count: 5,
      reversal_accuracy: 0.714286,
      missed_reversal_count: 2,
      quality_gate: {
        status: 'passed',
        deployment_enabled: true,
        failures: [],
      },
      direction_quality_gate: {
        status: 'partial',
        reversal: { status: 'passed' },
        continuation: { status: 'quarantined' },
      },
      raw_prediction_count: 12,
      raw_accuracy: 0.666667,
      raw_reverse_accuracy: 0.714286,
      raw_continue_accuracy: 0.6,
      coverage_target: 0.4,
      coverage_expansion_signal_count: 1,
      signal_tier_counts: {
        core: 7,
        expansion: 5,
        opportunity: 2,
        regime: 1,
      },
      predictions: [
        {
          signal_date: '2026-04-01',
          outcome_date: '2026-04-08',
          horizon_days: 5,
          touched_side: 'Lower',
          predicted_direction: 'reversal',
          actual_direction: 'reversal',
          confidence_score: 68,
          is_correct: true,
        },
      ],
      recent_predictions: [
        {
          signal_date: '2026-04-01',
          outcome_date: '2026-04-08',
          horizon_days: 5,
          touched_side: 'Lower',
          predicted_direction: 'reversal',
          actual_direction: 'reversal',
          confidence_score: 68,
          is_correct: true,
        },
      ],
    },
    '10d': {
      period_start: '2025-04-15',
      period_end: '2026-04-15',
      eligible_touch_count: 30,
      prediction_count: 0,
      sample_count: 0,
      no_prediction_count: 30,
      coverage: 0,
      correct_count: 0,
      accuracy: null,
      continuation_call_count: 0,
      continuation_correct_count: 0,
      continuation_accuracy: null,
      reversal_call_count: 0,
      reversal_correct_count: 0,
      reversal_accuracy: null,
      missed_reversal_count: 0,
      quality_gate: {
        status: 'quarantined',
        deployment_enabled: false,
        failures: ['weak_reverse_accuracy'],
      },
      direction_quality_gate: {
        status: 'quarantined',
        reversal: { status: 'quarantined' },
        continuation: { status: 'quarantined' },
      },
      raw_prediction_count: 2,
      raw_accuracy: 0,
      raw_reverse_accuracy: 0,
      raw_continue_accuracy: null,
      coverage_target: 0.4,
      coverage_expansion_signal_count: 0,
      signal_tier_counts: {},
      predictions: [],
      recent_predictions: [],
    },
  },
  chart_data: [
    {
      date: '2026-04-01',
      open: 100,
      high: 102,
      low: 98,
      close: 101,
      upper: 110,
      lower: 90,
      isTouch: true,
    },
    {
      date: '2026-04-14',
      open: 101,
      high: 103,
      low: 99,
      close: 102,
      upper: 111,
      lower: 91,
      isTouch: true,
    },
  ],
};

describe('EntryDecision', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders horizon decisions, accuracy, and prediction chart markers', async () => {
    fetchStockEntryDecision.mockResolvedValue(mockPayload);

    render(
      <MemoryRouter initialEntries={['/entry-decision?symbol=AAPL']}>
        <EntryDecision />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Entry Decision')).toBeInTheDocument();
      expect(screen.getByText('5-Day Direction')).toBeInTheDocument();
      expect(screen.getByText('10-Day Direction')).toBeInTheDocument();
      expect(screen.getByText('1Y 5D Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Bollinger Prediction Chart')).toBeInTheDocument();
      expect(screen.getAllByText('Training: 24 prior outcomes')).toHaveLength(2);
      expect(screen.getByText('Inputs: 116 features, 3/5 candidates')).toBeInTheDocument();
      expect(screen.getByText('Signal: Adaptive Analog Signal (0.83 precision / 12 prior)')).toBeInTheDocument();
      expect(screen.getAllByText('Deployment Gate: Passed').length).toBeGreaterThan(0);
      expect(screen.getByText('Reverse Edge: 92.0%')).toBeInTheDocument();
      expect(screen.getByText('Continue Edge: 85.0%')).toBeInTheDocument();
      expect(screen.getByText('Analog: 92.9% over 12 similar setups')).toBeInTheDocument();
      expect(screen.getByText('Reverse Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Continue Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Reverse Signals')).toBeInTheDocument();
      expect(screen.getByText('Continue Signals')).toBeInTheDocument();
      expect(screen.getByText('Model: Signal-Gated Regime')).toBeInTheDocument();
      expect(screen.getByText('Raw Accuracy 66.7%')).toBeInTheDocument();
      expect(screen.getByText('Core 7')).toBeInTheDocument();
      expect(screen.getByText('Expansion 5')).toBeInTheDocument();
      expect(screen.getByText('Opportunity 2')).toBeInTheDocument();
      expect(screen.getByText('Regime 1')).toBeInTheDocument();
      expect(screen.getByText('Quarantined 0')).toBeInTheDocument();
      expect(screen.getByText('Target 40.0%')).toBeInTheDocument();
      expect(screen.getByText('Expanded 1')).toBeInTheDocument();
      expect(screen.getByText('Reverse Gate Passed')).toBeInTheDocument();
      expect(screen.getByText('Continue Gate Quarantined')).toBeInTheDocument();
      expect(screen.getByTestId('stock-chart')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
    });

    expect(fetchStockEntryDecision).toHaveBeenCalledWith(
      'AAPL',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.objectContaining({ signal: expect.any(Object) })
    );

    const chartProps = __getStockChartProps();
    expect(chartProps.summary.chart_data).toHaveLength(2);
    expect(chartProps.predictionMarkers).toHaveLength(2);
  });

  it('switches horizon and shows no-prediction reason', async () => {
    fetchStockEntryDecision.mockResolvedValue(mockPayload);

    render(
      <MemoryRouter initialEntries={['/entry-decision?symbol=AAPL']}>
        <EntryDecision />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('1Y 5D Accuracy')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '10D' }));

    expect(screen.getByText('1Y 10D Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Reason: Low Confidence')).toBeInTheDocument();
    expect(screen.getByText('Veto: Falling Knife No Exhaustion')).toBeInTheDocument();
    expect(screen.getByText('Deployment Gate: Quarantined')).toBeInTheDocument();
    expect(__getStockChartProps().predictionMarkers).toHaveLength(0);
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
      expect(fetchStockEntryDecision).toHaveBeenLastCalledWith(
        'AAPL',
        '2026-04-13',
        expect.objectContaining({ signal: expect.any(Object) })
      );
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
