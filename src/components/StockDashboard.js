// src/components/StockDashboard.jsx
import React, { useState, useMemo } from 'react';
import { Grid, Box, Paper, CircularProgress, Typography } from '@mui/material';
import Sidebar from './SideBar/Sidebar';
import MainContent from './MainContent';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSummary } from './Redux/summarySlice';

const StockDashboard = () => {
  const [symbol, setSymbol] = useState('');
  const dispatch = useDispatch();

  // Pull the Redux state for summary
  const {
    data: summary,
    loading,
    error
  } = useSelector((state) => state.summary);

  // When user submits a new symbol from the Sidebar
  const handleSymbolSubmit = (sym) => {
    setSymbol(sym);            // keep track of current symbol in local state if desired
    dispatch(fetchSummary(sym)); // fetch new summary from server
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
            // We can still pass the error down if Sidebar needs to show it
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
              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default StockDashboard;
