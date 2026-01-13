import React, { useMemo, useState, useEffect } from 'react';
import { Grid, Box, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Sidebar from './SideBar/Sidebar';
import MainContent from './MainContent';
import WorldMarketMap from './WorldMarketMap';
import { useSelector } from 'react-redux';

const StockDashboard = () => {
  /* -------------------------------- Redux state ------------------------------- */
  const {
    data: summary,
    loading,
    error,
    currentSymbol,
  } = useSelector((state) => state.summary);
  const activeSymbol = summary?.symbol || currentSymbol;
  const hasSymbol = Boolean(activeSymbol);
  const showLoading = loading && !error;
  const [chartRange, setChartRange] = useState('3M');

  useEffect(() => {
    if (summary?.symbol) {
      setChartRange('3M');
    }
  }, [summary?.symbol]);

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
  const scrollPanelSx = (theme) => ({
    height: '100%',
    overflowY: 'auto',
    pt: { xs: 2, md: 3 },
    pb: 0,
    pr: 1,
    scrollbarWidth: 'thin',
    scrollbarColor: `${alpha(theme.palette.primary.main, 0.5)} ${alpha(
      theme.palette.background.header,
      0.35
    )}`,
    '&::-webkit-scrollbar': {
      width: 8,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: alpha(theme.palette.background.header, 0.4),
      borderRadius: 999,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: alpha(theme.palette.text.primary, 0.28),
      borderRadius: 999,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.7),
    },
  });

  return (
    <Box sx={{ height: '100%' }}>
      <Grid
        container
        columnSpacing={hasSymbol ? 3 : 0}
        rowSpacing={{ xs: hasSymbol ? 3 : 0, md: 0 }}
        sx={{
          height: '100%',
          alignItems: 'stretch',
          pl: hasSymbol ? 3 : 0,
          pr: hasSymbol ? 3 : 0,
        }}
      >
        {hasSymbol && (
          <Grid item xs={12} md={3} sx={{ height: '100%', minHeight: 0 }}>
            <Box sx={scrollPanelSx}>
              <Sidebar summary={summary} error={error} chartRange={chartRange} />
            </Box>
          </Grid>
        )}

        <Grid item xs={12} md={hasSymbol ? 9 : 12} sx={{ height: '100%', minHeight: 0 }}>
          {showLoading ? (
            <Box
              sx={{
                height: '100%',
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={48} />
            </Box>
          ) : summary ? (
            <Box sx={scrollPanelSx}>
              <MainContent
                summary={summary}
                eventMap={eventMap}
                chartRange={chartRange}
                onChartRangeChange={setChartRange}
              />
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WorldMarketMap summaryError={error} />
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default StockDashboard;
