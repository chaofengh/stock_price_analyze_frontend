import React, { useState, useMemo } from 'react';
import { Grid, Box, Paper, CircularProgress, Typography } from '@mui/material';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import { fetchStockSummary } from '../API/StockService';

const StockDashboard = () => {
  const [symbol, setSymbol] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSymbolSubmit = async (sym) => {
    setLoading(true);
    setError('');
    setSummary(null);
    try {
      const data = await fetchStockSummary(sym);
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build eventMap for StockChart (using window_5 data)
  const eventMap = useMemo(() => {
    if (!summary) return {};
    const windowData = summary.window_5 || {};
    const map = {};
    function pushEvent(dateStr, eventObj) {
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(eventObj);
    }
    (windowData.upper_touch_pullbacks || []).forEach((pb) =>
      pushEvent(pb.touch_date || pb.hug_start_date, { type: 'upper_touch_pullback', ...pb })
    );
    (windowData.lower_touch_bounces || []).forEach((b) =>
      pushEvent(b.touch_date || b.hug_start_date, { type: 'lower_touch_bounce', ...b })
    );
    (windowData.upper_hug_pullbacks || []).forEach((pb) =>
      pushEvent(pb.hug_start_date || pb.touch_date, { type: 'upper_hug_pullback', ...pb })
    );
    (windowData.lower_hug_bounces || []).forEach((b) =>
      pushEvent(b.hug_start_date || b.touch_date, { type: 'lower_hug_bounce', ...b })
    );
    return map;
  }, [summary]);

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Sidebar
            symbol={symbol}
            setSymbol={setSymbol}
            onSubmit={handleSymbolSubmit}
            summary={summary}
            error={error}
          />
        </Grid>
        <Grid item xs={12} md={9}>
          {loading ? (
            <Box display="flex" justifyContent="center" sx={{ my: 6 }}>
              <CircularProgress size={48} />
            </Box>
          ) : summary ? (
            <MainContent summary={summary} eventMap={eventMap} />
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }} elevation={1}>
              <Typography variant="h6" color="textSecondary">
                Enter a stock symbol to begin analysis.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default StockDashboard;
