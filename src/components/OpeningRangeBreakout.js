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
  FormControlLabel
} from '@mui/material';
import AggregatedResultsTable from './AggregatedResultsTable';
import DailyTradeDetails from './DailyTradeDetails';
import CalendarComponent from './CalendarComponent';
import CandleChart from './CandleChart';

// Convert a date/time string to YYYY-MM-DD in the user's local time
function getLocalDateString(dateInput) {
  const d = new Date(dateInput); // parse as local
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

// For intraday annotation, find nearest candlestick to a given time
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

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const [calendarValue, setCalendarValue] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  const [intradayDataAll, setIntradayDataAll] = useState([]);
  const [intradayData, setIntradayData] = useState([]);
  const [annotations, setAnnotations] = useState([]);

  const [showDailyTrades, setShowDailyTrades] = useState(false);

  // Fetch data from the backend
  const handleSearch = async () => {
    if (!ticker) return;
    setError(null);
    setResults([]);
    setSelectedScenario(null);
    setIntradayData([]);
    setIntradayDataAll([]);
    setShowDailyTrades(false);

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
    }
  };

  // Allow Enter key to trigger search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Open the scenario dialog and build the daily PnL for the calendar
  const handleRowClick = (scenario) => {
    setSelectedScenario(scenario);
    const dailyPnls = aggregateDailyPnl(scenario.daily_trades);
    setCalendarData(dailyPnls);
    setOpenDialog(true);
    setShowDailyTrades(false);
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

  // Show daily PnL inside each calendar tile
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = getLocalDateString(date);
      const pnl = calendarData[dateStr];
      if (pnl !== undefined) {
        const color = pnl > 0 ? 'green' : pnl < 0 ? 'red' : 'inherit';
        return (
          <div style={{ textAlign: 'center', color, fontSize: '1rem' }}>
            {pnl.toFixed(2)}
          </div>
        );
      }
    }
    return null;
  };

  // When user clicks a calendar date, filter intraday data + build chart annotations
  const handleCalendarChange = (date) => {
    setCalendarValue(date);
    const dateStr = getLocalDateString(date);
    setSelectedDate(dateStr);

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

    if (selectedScenario) {
      const trade = selectedScenario.daily_trades.find(t => {
        return getLocalDateString(t.entry_time) === dateStr;
      });
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
              tooltip: 'Entry'
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
              tooltip: 'Exit'
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

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Opening Range Breakout Analysis
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          label="Enter Ticker"
          variant="outlined"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          sx={{ width: 200 }}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {results.length > 0 && (
        <AggregatedResultsTable
          results={results}
          onRowClick={handleRowClick}
        />
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          {selectedScenario?.scenario_name || 'Scenario Details'}
        </DialogTitle>
        <DialogContent>
          <CalendarComponent
            value={calendarValue}
            onChange={handleCalendarChange}
            tileContent={tileContent}
          />
          {selectedDate && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {`Intraday Chart for ${selectedDate}`}
              </Typography>
              <CandleChart
                data={intradayData}
                width={1100}
                height={500}
                annotations={annotations}
              />
            </Box>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={showDailyTrades}
                onChange={() => setShowDailyTrades(!showDailyTrades)}
                color="primary"
              />
            }
            label="Show Daily Trade Details"
          />
          {showDailyTrades && selectedScenario && (
            <DailyTradeDetails dailyTrades={selectedScenario.daily_trades} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default OpeningRangeBreakout;
