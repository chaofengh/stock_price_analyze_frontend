import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  FormControlLabel,
  Paper,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import AggregatedResultsTable from './AggregatedResultsTable';
import DailyTradeDetails from './DailyTradeDetails';
import CalendarComponent from './CalendarComponent';
import CandleChart from './CandleChart';

// 1) Helper: convert a date/time string to YYYY-MM-DD (for daily grouping).
function getLocalDateString(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 2) Sum daily PnL from scenario's trades by local day
function aggregateDailyPnl(dailyTrades) {
  return dailyTrades.reduce((acc, trade) => {
    const dateKey = getLocalDateString(trade.entry_time);
    if (!acc[dateKey]) acc[dateKey] = 0;
    acc[dateKey] += trade.pnl;
    return acc;
  }, {});
}

// 3) Find the candlestick nearest to a given trade time
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

const OpeningRangeBreakout = () => {
  const [ticker, setTicker] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dialog and scenario states
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Calendar & chart states
  const [calendarValue, setCalendarValue] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  // Intraday data
  const [intradayDataAll, setIntradayDataAll] = useState([]);
  const [intradayData, setIntradayData] = useState([]);
  const [annotations, setAnnotations] = useState([]);

  // Tabs and dark mode
  const [selectedTab, setSelectedTab] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  // Create MUI theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
    },
  });

  // 4) Fetch data from your backend
  const handleSearch = async () => {
    if (!ticker) return;
    setError(null);
    setLoading(true);
    setResults([]);
    setSelectedScenario(null);
    setIntradayData([]);
    setIntradayDataAll([]);

    try {
      const endpoint = `${process.env.REACT_APP_summary_root_api}/opening_range_breakout?ticker=${ticker}`;
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

  // 5) Allow hitting 'Enter' in the ticker TextField
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 6) Clicking on a row -> open scenario details in a dialog
  const handleRowClick = (scenario) => {
    setSelectedScenario(scenario);

    // Aggregate daily PnL for the scenario's trades
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

  // 7) Calendar tile content: show numeric PnL
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
                margin: '0 4px',
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

  // 8) When user picks a date from the calendar
  const handleCalendarChange = (date) => {
    setCalendarValue(date);

    const dateStr = getLocalDateString(date);
    setSelectedDate(dateStr);

    // Filter intraday data for that day
    const dayData = intradayDataAll
      .filter(record => getLocalDateString(record.date) === dateStr)
      .map(record => ({
        date: new Date(record.date),
        open: record.open,
        high: record.high,
        low: record.low,
        close: record.close,
        volume: record.volume,
      }));

    setIntradayData(dayData);

    // Build buy/sell annotations if there's a trade on that day
    if (selectedScenario) {
      const trade = selectedScenario.daily_trades.find(t =>
        getLocalDateString(t.entry_time) === dateStr
      );

      if (trade) {
        const newAnnotations = [];

        if (trade.entry_time) {
          const entryTime = new Date(trade.entry_time);
          const entryDataPoint = findNearestDataPoint(dayData, entryTime);
          if (entryDataPoint) {
            newAnnotations.push({
              date: entryDataPoint.date,
              fill: 'green',
              path: () => 'M0,0 L10,10',
              tooltip: `Entry @ ${entryTime.toLocaleTimeString()}`,
              direction: trade.direction
            });
          }
        }

        if (trade.exit_time) {
          const exitTime = new Date(trade.exit_time);
          const exitDataPoint = findNearestDataPoint(dayData, exitTime);
          if (exitDataPoint) {
            newAnnotations.push({
              date: exitDataPoint.date,
              fill: 'red',
              path: () => 'M0,0 L10,10',
              tooltip: `Exit @ ${exitTime.toLocaleTimeString()}`,
              direction: trade.direction
            });
          }
        }

        setAnnotations(newAnnotations);
      } else {
        setAnnotations([]);
      }
    } else {
      setAnnotations([]);
    }
  };

  // 9) Tab switching
  const handleTabChange = (e, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <Paper elevation={3} sx={{ p: 3, m: 3 }}>
        <Typography variant="h5" gutterBottom>
          Opening Range Breakout Analysis
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Enter Ticker"
              variant="outlined"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button fullWidth variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  color="primary"
                />
              }
              label="Dark Mode"
            />
          </Grid>
        </Grid>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {!loading && results.length === 0 && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            Enter a ticker and click search to view scenarios.
          </Typography>
        )}

        {/* Only show table if we have results */}
        {results.length > 0 && (
          <AggregatedResultsTable
            results={results}
            onRowClick={handleRowClick}
          />
        )}
      </Paper>

      {/* Dialog for scenario details (Calendar + Chart or DailyTradeDetails) */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          {selectedScenario?.scenario_name || 'Scenario Details'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={selectedTab} onChange={handleTabChange} centered>
            <Tab label="Calendar & Chart" />
            <Tab label="Trade Details" />
          </Tabs>

          {/* CALENDAR & CHART TAB */}
          {selectedTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                {/* Calendar Section */}
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Select a Date
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Choose a date below to view daily PNL and the intraday chart.
                  </Typography>
                  <CalendarComponent
                    value={calendarValue}
                    onChange={handleCalendarChange}
                    tileContent={tileContent}
                    height="100%"
                  />
                </Paper>

                {/* Chart Section */}
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Intraday Chart {selectedDate ? `– ${selectedDate}` : ''}
                  </Typography>
                  {selectedDate && intradayData?.length > 0 ? (
                    <CandleChart
                      data={intradayData}
                      annotations={annotations}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {selectedDate
                        ? 'No intraday data found for this date.'
                        : 'No date selected.'}
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>
          )}

          {/* TRADE DETAILS TAB */}
          {selectedTab === 1 && (
            <Box sx={{ p: 2 }}>
              {selectedScenario ? (
                <DailyTradeDetails dailyTrades={selectedScenario.daily_trades} />
              ) : (
                <Typography variant="body1">
                  No trade details available.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default OpeningRangeBreakout;
