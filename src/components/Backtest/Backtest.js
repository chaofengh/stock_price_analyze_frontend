// File: Backtest.js
import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Tooltip,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Divider
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import AggregatedResultsTable from './AggregatedResultsTable';
import DailyTradeDetails from './DailyTradeDetails';
import CalendarComponent from './CalendarComponent';
import CandleChart from '../CandleChart';

// Helper: convert date/time string to YYYY-MM-DD
function getLocalDateString(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Sum daily PnL from scenario trades by local day
function aggregateDailyPnl(dailyTrades) {
  return dailyTrades.reduce((acc, trade) => {
    const dateKey = getLocalDateString(trade.entry_time);
    if (!acc[dateKey]) acc[dateKey] = 0;
    acc[dateKey] += trade.pnl;
    return acc;
  }, {});
}

// Find nearest candlestick to the trade time
function findNearestDataPoint(data, targetTime) {
  let minDiff = Infinity;
  let nearest = null;
  for (let d of data) {
    const diff = Math.abs(d.date - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = d;
    }
  }
  return nearest;
}

const Backtest = () => {
  const [ticker, setTicker] = useState('');
  const [strategy, setStrategy] = useState('opening_range_breakout');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dialog / scenario details
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Calendar & chart
  const [calendarValue, setCalendarValue] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  // Intraday chart data & annotations
  const [intradayDataAll, setIntradayDataAll] = useState([]);
  const [intradayData, setIntradayData] = useState([]);
  const [annotations, setAnnotations] = useState([]);

  // Tabs in the dialog
  const [selectedTab, setSelectedTab] = useState(0);

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' }
    }
  });

  const handleSearch = async () => {
    if (!ticker) return;
    setError(null);
    setLoading(true);
    setResults([]);
    setSelectedScenario(null);
    setIntradayData([]);
    setIntradayDataAll([]);

    try {
      // Updated endpoint => /api/backtest
      const endpoint = `${process.env.REACT_APP_summary_root_api}/backtest?ticker=${ticker}&strategy=${strategy}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();

      setResults(data.scenarios);
      setIntradayDataAll(data.intraday_data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRowClick = (scenario) => {
    setSelectedScenario(scenario);
    const dailyPnls = aggregateDailyPnl(scenario.daily_trades);
    setCalendarData(dailyPnls);

    setOpenDialog(true);
    setSelectedTab(0);
    setSelectedDate(null);
    setIntradayData([]);
    setAnnotations([]);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedScenario(null);
    setSelectedDate(null);
    setIntradayData([]);
    setAnnotations([]);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = getLocalDateString(date);
      const pnl = calendarData[dateStr];
      const isSelected = selectedDate === dateStr;

      if (pnl !== undefined) {
        const color = pnl > 0 ? 'green' : pnl < 0 ? 'red' : 'inherit';
        const fontWeight = isSelected ? 'bold' : 'normal';
        return (
          <Tooltip title={`PNL: ${pnl.toFixed(2)}`} arrow>
            <div
              style={{
                textAlign: 'center',
                color,
                fontSize: '1.1rem',
                fontWeight,
                background: 'transparent',
                borderRadius: '4px',
                margin: '0 4px'
              }}
            >
              {pnl.toFixed(2)}
            </div>
          </Tooltip>
        );
      }
    }
    return null;
  };

  const handleCalendarChange = (date) => {
    setCalendarValue(date);
    const dateStr = getLocalDateString(date);
    setSelectedDate(dateStr);

    // Filter intraday data for the selected date
    const dayData = intradayDataAll
      .filter(rec => getLocalDateString(rec.date) === dateStr)
      .map(rec => ({
        date: new Date(rec.date),
        open: rec.open,
        high: rec.high,
        low: rec.low,
        close: rec.close,
        volume: rec.volume
      }));

    setIntradayData(dayData);

    if (selectedScenario) {
      const tradesThatDay = selectedScenario.daily_trades.filter(t =>
        getLocalDateString(t.entry_time) === dateStr
      );
      const newAnnotations = [];
      tradesThatDay.forEach((trade, idx) => {
        if (!trade.entry_time || !trade.exit_time) return;
        const entryTime = new Date(trade.entry_time);
        const exitTime = new Date(trade.exit_time);
        const entryDataPoint = findNearestDataPoint(dayData, entryTime);
        const exitDataPoint = findNearestDataPoint(dayData, exitTime);

        if (entryDataPoint && exitDataPoint) {
          const fillColor =
            trade.direction === 'long'
              ? 'rgba(0, 128, 0, 0.15)'
              : 'rgba(255, 0, 0, 0.15)';

          newAnnotations.push({
            type: 'trade-rectangle',
            entryDate: entryDataPoint.date,
            exitDate: exitDataPoint.date,
            direction: trade.direction,
            fill: fillColor,
            label: `Trade #${idx + 1} (${trade.direction.toUpperCase()})`
          });

          newAnnotations.push({
            type: 'entry-marker',
            date: entryDataPoint.date,
            tooltip: `Entry @ ${entryTime.toLocaleTimeString()}`,
            direction: trade.direction
          });

          newAnnotations.push({
            type: 'exit-marker',
            date: exitDataPoint.date,
            tooltip: `Exit @ ${exitTime.toLocaleTimeString()} (PNL: ${trade.pnl.toFixed(2)})`,
            direction: trade.direction
          });
        }
      });
      setAnnotations(newAnnotations);
    } else {
      setAnnotations([]);
    }
  };

  const handleTabChange = (e, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* HEADER */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Strategy Backtest
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Explore backtest results for various strategies. Use the controls below to run a new backtest.
          </Typography>
        </Box>

        {/* SEARCH CONTROLS */}
        <Paper elevation={3} sx={{ p: 3, mb: 5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="Enter Ticker"
                variant="outlined"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Strategy</InputLabel>
                <Select
                  value={strategy}
                  label="Strategy"
                  onChange={(e) => setStrategy(e.target.value)}
                >
                  <MenuItem value="opening_range_breakout">Opening Range Breakout</MenuItem>
                  <MenuItem value="reverse_opening_range_breakout">Reverse ORB</MenuItem>
                  {/* Extend with more strategies here */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                sx={{ height: '100%' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* LOADING/ERROR/EMPTY-STATE MESSAGES */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {!loading && results.length === 0 && !error && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            Enter a ticker and choose a strategy to backtest.
          </Typography>
        )}

        {/* RESULTS & FILTERS TABLE */}
        {results.length > 0 && (
          <Paper elevation={0} sx={{ mb: 2, p:3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Filter Scenarios
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {/* Aggregated Results Table (with built-in filters) */}
            <AggregatedResultsTable results={results} onRowClick={handleRowClick} />
          </Paper>
        )}

        {/* SCENARIO DIALOG */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="xl"
          fullWidth
        >
          <DialogTitle>
            {selectedScenario?.scenario_name || 'Scenario Details'}
          </DialogTitle>
          <DialogContent>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              centered
              sx={{ mb: 2 }}
            >
              <Tab label="Calendar & Chart" />
              <Tab label="Trade Details" />
            </Tabs>

            {selectedTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Select a Date
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Pick a date below to view daily PNL and the intraday chart.
                  </Typography>
                  <CalendarComponent
                    value={calendarValue}
                    onChange={handleCalendarChange}
                    tileContent={tileContent}
                  />
                </Paper>

                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Intraday Chart {selectedDate ? `– ${selectedDate}` : ''}
                  </Typography>
                  {selectedDate && intradayData.length > 0 ? (
                    <CandleChart data={intradayData} annotations={annotations} />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {selectedDate ? 'No intraday data found for this date.' : 'No date selected.'}
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            {selectedTab === 1 && (
              <Box>
                {selectedScenario ? (
                  <DailyTradeDetails dailyTrades={selectedScenario.daily_trades} />
                ) : (
                  <Typography variant="body1">No trade details available.</Typography>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
};

export default Backtest;
