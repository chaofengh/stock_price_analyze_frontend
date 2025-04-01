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

// Helper functions for sorting and aggregation
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilized = array.map((el, idx) => [el, idx]);
  stabilized.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    if (cmp !== 0) return cmp;
    return a[1] - b[1];
  });
  return stabilized.map(el => el[0]);
}

function aggregateDailyPnl(dailyTrades) {
  return dailyTrades.reduce((acc, trade) => {
    const dateKey = new Date(trade.date).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = 0;
    acc[dateKey] += trade.pnl;
    return acc;
  }, {});
}

// Utility: Find the nearest data point for annotations
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
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('scenario_name');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const [calendarValue, setCalendarValue] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  const [intradayDataAll, setIntradayDataAll] = useState([]);
  const [intradayData, setIntradayData] = useState([]);
  const [annotations, setAnnotations] = useState([]);

  const [showDailyTrades, setShowDailyTrades] = useState(false);

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedResults = stableSort(results, getComparator(order, orderBy));

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

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
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

  const handleCalendarChange = (date) => {
    setCalendarValue(date);
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    const dayData = intradayDataAll
      .filter(record => record.date.split('T')[0] === dateStr)
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
        const tradeDateStr = new Date(t.date).toISOString().split('T')[0];
        return tradeDateStr === dateStr;
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
              path: 'M0,0 L10,10', // Replace with buyPath if available
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
              path: 'M0,0 L10,10', // Replace with sellPath if available
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
          results={sortedResults}
          order={order}
          orderBy={orderBy}
          onSort={handleSort}
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
