import React, { useMemo } from 'react';
import { Grid, Box, Paper, CircularProgress, Typography } from '@mui/material';
import Sidebar from './SideBar/Sidebar';
import MainContent from './MainContent';
import { useSelector } from 'react-redux';

const StockDashboard = () => {
  /* -------------------------------- Redux state ------------------------------- */
  const {
    data: summary,
    loading,
    error,
  } = useSelector((state) => state.summary);

  /* -------------- Build eventMap for StockChart from window_5 data ------------ */
  const eventMap = useMemo(() => {
    if (!summary) return {};
    const windowData = summary.window_5 || {};
    const map = {};

    const pushEvent = (dateStr, eventObj) => {
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(eventObj);
    };

    (windowData.upper_touch_pullbacks || []).forEach((pb) =>
      pushEvent(pb.touch_date || pb.hug_start_date, {
        type: 'upper_touch_pullback',
        ...pb,
      }),
    );
    (windowData.lower_touch_bounces || []).forEach((b) =>
      pushEvent(b.touch_date || b.hug_start_date, {
        type: 'lower_touch_bounce',
        ...b,
      }),
    );
    (windowData.upper_hug_pullbacks || []).forEach((pb) =>
      pushEvent(pb.hug_start_date || pb.touch_date, {
        type: 'upper_hug_pullback',
        ...pb,
      }),
    );
    (windowData.lower_hug_bounces || []).forEach((b) =>
      pushEvent(b.hug_start_date || b.touch_date, {
        type: 'lower_hug_bounce',
        ...b,
      }),
    );

    return map;
  }, [summary]);

  /* -------------------------------- Rendering --------------------------------- */
  return (
    <Box sx={{ height: '100%' }}>
      <Grid
        container
        columnSpacing={3}
        rowSpacing={{ xs: 3, md: 0 }}
        sx={{ height: '100%', alignItems: 'stretch' }}
      >
        <Grid item xs={12} md={3} sx={{ height: '100%', minHeight: 0 }}>
          <Box sx={{ height: '100%', overflowY: 'auto', pr: 1 }}>
            <Sidebar summary={summary} error={error} />
          </Box>
        </Grid>

        <Grid item xs={12} md={9} sx={{ height: '100%', minHeight: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" sx={{ my: 6 }}>
              <CircularProgress size={48} />
            </Box>
          ) : summary ? (
            <Box sx={{ height: '100%', overflowY: 'auto', pr: 1 }}>
              <MainContent summary={summary} eventMap={eventMap} />
            </Box>
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
