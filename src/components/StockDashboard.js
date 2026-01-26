import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Grid, Box, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Sidebar from './SideBar/Sidebar';
import MainContent from './MainContent';
import WorldMarketMap from './WorldMarketMap';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';

const StockDashboard = () => {
  /* -------------------------------- Redux state ------------------------------- */
  const {
    data: summary,
    loading,
    error,
    currentSymbol,
  } = useSelector((state) => state.summary);
  const location = useLocation();
  const posthog = usePostHog();
  const lastViewedRef = useRef(null);
  const lastSearchedRef = useRef(null);
  const activeSymbol = summary?.symbol || currentSymbol;
  const hasSymbol = Boolean(activeSymbol);
  const showLoading = loading && !error;
  const [chartRange, setChartRange] = useState('3M');
  const viewSource = location.state?.source;
  const fromAlertId = viewSource === 'alert' ? location.state?.from_alert_id : null;
  const resolvedSource = viewSource || 'search';

  useEffect(() => {
    if (summary?.symbol) {
      setChartRange('3M');
    }
  }, [summary?.symbol]);

  useEffect(() => {
    if (!summary?.symbol || loading || error) return;
    const symbol = summary.symbol.trim().toUpperCase();
    if (!symbol) return;
    const captureKey = `${location.key || symbol}:${symbol}:${resolvedSource}:${fromAlertId || ''}`;
    if (lastViewedRef.current === captureKey) return;
    lastViewedRef.current = captureKey;
    posthog?.capture('ticker_viewed', {
      symbol,
      source: resolvedSource,
      from_alert_id: fromAlertId || null,
    });
  }, [error, fromAlertId, loading, location.key, posthog, resolvedSource, summary?.symbol]);

  useEffect(() => {
    if (!summary?.symbol || loading || error) return;
    if (!location.state?.capture_ticker_searched) return;

    const symbol = summary.symbol.trim().toUpperCase();
    if (!symbol) return;

    const captureKey = `${location.key || symbol}:${symbol}`;
    if (lastSearchedRef.current === captureKey) return;
    lastSearchedRef.current = captureKey;

    const startedAt = Number(location.state?.search_started_at);
    const latencyMs = Number.isFinite(startedAt) ? Date.now() - startedAt : null;
    const rawQuery = location.state?.query;
    const query = typeof rawQuery === 'string' && rawQuery.trim() ? rawQuery.trim() : symbol;

    posthog?.capture('ticker_searched', {
      query,
      symbol_normalized: symbol,
      source: 'alert',
      results_count: 1,
      latency_ms: Number.isFinite(latencyMs) ? latencyMs : null,
    });
  }, [
    error,
    loading,
    location.key,
    location.state?.capture_ticker_searched,
    location.state?.query,
    location.state?.search_started_at,
    posthog,
    summary?.symbol,
  ]);

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
