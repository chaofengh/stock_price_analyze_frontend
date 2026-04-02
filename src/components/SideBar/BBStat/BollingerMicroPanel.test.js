import { fireEvent, render, screen } from '@testing-library/react';
import BollingerMicroPanel from './BollingerMicroPanel';

const summary = {
  symbol: 'TEST',
  chart_data: [
    { date: '2024-10-01' },
    { date: '2024-12-31' },
  ],
  window_5: {
    lower_touch_bounces: [],
    upper_touch_pullbacks: [],
  },
  window_10: {
    lower_touch_bounces: [],
    upper_touch_pullbacks: [],
  },
  avg_consecutive_touch_days: {
    '1M': { upper: 1.5, lower: 2.5 },
    '3M': { upper: 3.2, lower: 4.2 },
    YTD: { upper: 5.3, lower: 6.3 },
    '1Y': { upper: 7.4, lower: 8.4 },
  },
};

describe('BollingerMicroPanel consecutive touch days', () => {
  test('shows range-specific upper values from backend metric', () => {
    const { rerender } = render(<BollingerMicroPanel summary={summary} range="1M" />);

    expect(screen.getByText('Avg Touch Streak')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'UpperBB' }));
    expect(screen.getByText('1.5')).toBeInTheDocument();

    rerender(<BollingerMicroPanel summary={summary} range="3M" />);
    fireEvent.click(screen.getByRole('button', { name: 'UpperBB' }));
    expect(screen.getByText('3.2')).toBeInTheDocument();

    rerender(<BollingerMicroPanel summary={summary} range="YTD" />);
    fireEvent.click(screen.getByRole('button', { name: 'UpperBB' }));
    expect(screen.getByText('5.3')).toBeInTheDocument();

    rerender(<BollingerMicroPanel summary={summary} range="1Y" />);
    fireEvent.click(screen.getByRole('button', { name: 'UpperBB' }));
    expect(screen.getByText('7.4')).toBeInTheDocument();
  });

  test('switches between upper and lower band values for selected range', () => {
    render(<BollingerMicroPanel summary={summary} range="1M" />);

    fireEvent.click(screen.getByRole('button', { name: 'UpperBB' }));
    expect(screen.getByText('1.5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'LowerBB' }));
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });
});
