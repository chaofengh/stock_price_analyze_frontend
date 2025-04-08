// OpeningRangeBreakout.js
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

// Convert a date/time string to YYYY-MM-DD in the user's local time
function getLocalDateString(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Sum daily PnL by local date using 'entry_time'
function aggregateDailyPnl(dailyTrades) {
  return dailyTrades.reduce((acc, trade) => {
    const dateKey = getLocalDateString(trade.entry_time);
    if (!acc[dateKey]) acc[dateKey] = 0;
    acc[dateKey] += trade.pnl;
    return acc;
  }, {});
}

// For intraday annotation, find the nearest candlestick to a given time
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
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [calendarValue, setCalendarValue] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [intradayDataAll, setIntradayDataAll] = useState([]);
  const [intradayData, setIntradayData] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
    },
  });

  // Fetch data from the backend
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Open the scenario dialog and prepare calendar data
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
    setSelectedDate(null);
    setIntradayData([]);
    setAnnotations([]);
  };

  // Calendar tile content with a simpler numeric PnL display
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = getLocalDateString(date);
      const pnl = calendarData[dateStr];
      const isSelectedDate = selectedDate && selectedDate === dateStr;

      if (pnl !== undefined) {
        const color = pnl > 0 ? 'green' : pnl < 0 ? 'red' : 'inherit';
        const fontWeight = isSelectedDate ? 'bold' : 'normal';

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

  // Handle calendar change: update intraday chart and annotations
  const handleCalendarChange = (date) => {
    setCalendarValue(date);
    const dateStr = getLocalDateString(date);
    setSelectedDate(dateStr);

    // Filter intraday data for the chosen date
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

    // Build annotations if there's a trade on that date
    if (selectedScenario) {
      const trade = selectedScenario.daily_trades.find(
        t => getLocalDateString(t.entry_time) === dateStr
      );

      if (trade) {
        const newAnnotations = [];

        // Entry annotation
        if (trade.entry_time) {
          const entryTime = new Date(trade.entry_time);
          const entryDataPoint = findNearestDataPoint(dayData, entryTime);
          if (entryDataPoint) {
            newAnnotations.push({
              date: entryDataPoint.date,
              fill: 'green',
              path: () => 'M0,0 L10,10',
              tooltip: 'Entry',
            });
          }
        }

        // Exit annotation
        if (trade.exit_time) {
          const exitTime = new Date(trade.exit_time);
          const exitDataPoint = findNearestDataPoint(dayData, exitTime);
          if (exitDataPoint) {
            newAnnotations.push({
              date: exitDataPoint.date,
              fill: 'red',
              path: () => 'M0,0 L10,10',
              tooltip: 'Exit',
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

        {results.length > 0 && (
          <AggregatedResultsTable results={results} onRowClick={handleRowClick} />
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          {selectedScenario?.scenario_name || 'Scenario Details'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={selectedTab} onChange={handleTabChange} centered>
            <Tab label="Calendar & Chart" />
            <Tab label="Trade Details" />
          </Tabs>

          {selectedTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {/* Calendar Section */}
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Select a date to see daily PNL & intraday chart:
                  </Typography>
                  <CalendarComponent
                    value={calendarValue}
                    onChange={handleCalendarChange}
                    tileContent={tileContent}
                  />
                </Grid>

                {/* Chart Section */}
                <Grid item xs={12} md={7}>
                  {selectedDate ? (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Intraday Chart for {selectedDate}
                      </Typography>
                      <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 2 }}>
                        {intradayData && intradayData.length > 0 ? (
                          <CandleChart
                            data={intradayData}
                            width={650}
                            height={450}
                            annotations={annotations}
                            xAxisLabel="Time"
                            yAxisLabel="Price"
                            chartTitle="Intraday Candlestick"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No intraday data found for this date.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Please select a date from the calendar.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {selectedTab === 1 && (
            <Box sx={{ p: 2 }}>
              {selectedScenario ? (
                <DailyTradeDetails dailyTrades={selectedScenario.daily_trades} />
              ) : (
                <Typography variant="body1">No trade details available.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default OpeningRangeBreakout;
