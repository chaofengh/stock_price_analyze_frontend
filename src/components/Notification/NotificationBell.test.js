import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { vi } from 'vitest';
import NotificationBell from './NotificationBell';
import { AlertsContext } from './AlertContext';
import theme from '../../theme';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderBell = (contextValue) => {
  const value = {
    alerts: [],
    openEntrySignals: [],
    openEntrySignalStories: [],
    timestamp: '2026-05-16T22:30:00Z',
    clearAlerts: vi.fn(),
    ...contextValue,
  };

  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <AlertsContext.Provider value={value}>
          <NotificationBell />
        </AlertsContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

  return value;
};

describe('NotificationBell', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows the backend trade story with every open setup and links to the entry decision page', () => {
    renderBell({
      openEntrySignals: [
        {
          _signal_id: 'entry-signal|AAPL|2026-05-11|5',
          symbol: 'AAPL',
          signal_date: '2026-05-11',
          horizon_days: 5,
          predicted_direction: 'continuation',
          interim_status: 'working',
          remaining_sessions: 1,
          signal_close: 292.68,
          current_close: 300.23,
          current_trade_return: 0.0258,
          progress: 0.8,
        },
        {
          _signal_id: 'entry-signal|AAPL|2026-05-04|10',
          symbol: 'AAPL',
          signal_date: '2026-05-04',
          horizon_days: 10,
          predicted_direction: 'continuation',
          interim_status: 'working',
          remaining_sessions: 1,
          signal_close: 276.58,
          current_close: 300.23,
          current_trade_return: 0.0855,
          progress: 0.9,
        },
        {
          _signal_id: 'entry-signal|AAPL|2026-05-06|10',
          symbol: 'AAPL',
          signal_date: '2026-05-06',
          horizon_days: 10,
          predicted_direction: 'continuation',
          interim_status: 'working',
          remaining_sessions: 3,
          signal_close: 287.25,
          current_close: 300.23,
          current_trade_return: 0.0452,
          progress: 0.7,
        },
        {
          _signal_id: 'entry-signal|AAPL|2026-05-07|10',
          symbol: 'AAPL',
          signal_date: '2026-05-07',
          horizon_days: 10,
          predicted_direction: 'continuation',
          interim_status: 'working',
          remaining_sessions: 4,
          signal_close: 287.18,
          current_close: 300.23,
          current_trade_return: 0.0455,
          progress: 0.6,
        },
        {
          _signal_id: 'entry-signal|AAPL|2026-05-08|10',
          symbol: 'AAPL',
          signal_date: '2026-05-08',
          horizon_days: 10,
          predicted_direction: 'reversal',
          interim_status: 'against',
          remaining_sessions: 5,
          signal_close: 293.05,
          current_close: 300.23,
          current_trade_return: -0.0245,
          progress: 0.5,
        },
        {
          _signal_id: 'entry-signal|AAPL|2026-05-11|10',
          symbol: 'AAPL',
          signal_date: '2026-05-11',
          horizon_days: 10,
          predicted_direction: 'reversal',
          interim_status: 'against',
          remaining_sessions: 6,
          signal_close: 292.68,
          current_close: 300.23,
          current_trade_return: -0.0258,
          progress: 0.4,
        },
      ],
      openEntrySignalStories: [
        {
          version: 'entry_signal_story_v1',
          symbol: 'AAPL',
          stance: 'mixed',
          headline: 'AAPL has continuation support, but reversal risk is still open',
          summary: 'Open setups: 5D Continuation, 10D Continuation, and 10D Reversal.',
          watch: 'Use this as competing model evidence, not a single yes/no call. Compare the near-term setup with the opposing setup before acting.',
          signal_count: 6,
          setup_count: 3,
          current_close: 300.23,
          next_remaining: 1,
          remaining_summary: '1-6 sessions left',
          setups: [
            {
              key: '5|continuation|working',
              role: 'near_term',
              label: 'Near term',
              horizon_days: 5,
              predicted_direction: 'continuation',
              interim_status: 'working',
              signal_count: 1,
              remaining_summary: '1 session left',
              entry_summary: '$292.68',
              return_summary: '+2.58%',
            },
            {
              key: '10|continuation|working',
              role: 'supporting',
              label: 'Also supports',
              horizon_days: 10,
              predicted_direction: 'continuation',
              interim_status: 'working',
              signal_count: 3,
              remaining_summary: '1-4 sessions left',
              entry_summary: '$276.58 to $287.25',
              return_summary: '+4.52% to +8.55%',
            },
            {
              key: '10|reversal|against',
              role: 'risk',
              label: 'Opposing risk',
              horizon_days: 10,
              predicted_direction: 'reversal',
              interim_status: 'against',
              signal_count: 2,
              remaining_summary: '5-6 sessions left',
              entry_summary: '$292.68 to $293.05',
              return_summary: '-2.58% to -2.45%',
            },
          ],
        },
      ],
    });

    fireEvent.click(screen.getByLabelText('Open alerts and open entry signals'));

    expect(screen.getByText('Alerts & Open Signals')).toBeInTheDocument();
    expect(screen.getByText('Open Entry Signals')).toBeInTheDocument();
    expect(screen.getByText('1 ticker')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('6 open signals')).toBeInTheDocument();
    expect(screen.getByText('AAPL has continuation support, but reversal risk is still open')).toBeInTheDocument();
    expect(screen.getByText('Open setups: 5D Continuation, 10D Continuation, and 10D Reversal.')).toBeInTheDocument();
    expect(screen.getByText('Use this as competing model evidence, not a single yes/no call. Compare the near-term setup with the opposing setup before acting.')).toBeInTheDocument();
    expect(screen.getByText('Near term')).toBeInTheDocument();
    expect(screen.getByText('Also supports')).toBeInTheDocument();
    expect(screen.getByText('Opposing risk')).toBeInTheDocument();
    expect(screen.getAllByText('Working').length).toBeGreaterThan(0);
    expect(screen.getByText('Against')).toBeInTheDocument();
    expect(screen.getByText('5D Continuation')).toBeInTheDocument();
    expect(screen.getByText('10D Continuation')).toBeInTheDocument();
    expect(screen.getByText('10D Reversal')).toBeInTheDocument();
    expect(screen.getAllByText('3 signals').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1-4 sessions left').length).toBeGreaterThan(0);
    expect(screen.queryByText('2 signals • next 2 sessions left')).not.toBeInTheDocument();
    expect(screen.getAllByText('5-6 sessions left').length).toBeGreaterThan(0);
    expect(screen.getByText(/Current \$300\.23/)).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse open entry signals')).toBeInTheDocument();
    expect(screen.queryByText('May 11, 2026')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Show AAPL signal details'));
    expect(screen.getByLabelText('Expand 10D Continuation Working signals')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Expand 10D Continuation Working signals'));
    expect(screen.getByText('May 4, 2026')).toBeInTheDocument();
    expect(screen.getByText('May 6, 2026')).toBeInTheDocument();
    expect(screen.getByText('May 7, 2026')).toBeInTheDocument();
    expect(screen.getByText('Entry $276.58')).toBeInTheDocument();
    expect(screen.getAllByText('+8.55%').length).toBeGreaterThan(0);
    expect(screen.getByText('90%')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Collapse AAPL open entry signals'));
    expect(screen.getByLabelText('Expand AAPL open entry signals')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Expand AAPL open entry signals'));

    fireEvent.click(screen.getByLabelText('Open AAPL entry decision'));

    expect(mockNavigate).toHaveBeenCalledWith('/entry-decision?symbol=AAPL', {
      state: expect.objectContaining({
        source: 'entry_signal',
        from_signal_id: 'entry-signal|AAPL|2026-05-11|5',
        query: 'AAPL',
      }),
    });
  });
});
