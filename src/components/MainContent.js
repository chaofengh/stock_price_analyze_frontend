import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import StockChart from './Chart/StockChart';
import GroupedStats from './GroupedStats';
import AdvancedMetrics from './AdvancedMetrics';
import MarketSentiment from './MarketSentiment';
import NewsWidget from './NewsWidget';

// Custom hook: Animate a number from its previous value to a new one
function useAnimatedNumber(value, duration = 400) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = startValue + (value - startValue) * progress;
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
      }
    }

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}

const MainContent = ({ summary, eventMap }) => {
  // State to store hovered price/date from the chart
  const [hoverData, setHoverData] = useState(null);

  // Use hovered price if available, otherwise fallback to final price
  const rawPrice = hoverData?.price ?? summary?.final_price ?? 0;
  const animatedPrice = useAnimatedNumber(rawPrice);

  // Determine price color based on daily change
  const priceChange = summary?.price_change_in_dollars ?? 0;
  const priceColor =
    priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'textPrimary';

  // Get latest chart data (for Bollinger bands)
  let latestChartData = null;
  if (summary?.chart_data?.length > 0) {
    latestChartData = [...summary.chart_data].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
  }

  return (
    <Box>
      {summary && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" align="center">
            {summary.symbol || 'Company Name'} -{' '}
            <span style={{ color: priceColor }}>
              ${animatedPrice.toFixed(2)}
            </span>
          </Typography>

          {latestChartData && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mt={2}
            >
              <Typography variant="body1">
                Upper Bollinger Band:{' '}
                <span
                  style={{
                    fontWeight: 'bold',
                    padding: '0.3rem 0.6rem',
                    backgroundColor: '#d4edda',
                    color: '#28a745',
                    borderRadius: '6px',
                  }}
                >
                  ${latestChartData.upper.toFixed(2)}
                </span>
              </Typography>
              <Typography variant="body1">
                Lower Bollinger Band:{' '}
                <span
                  style={{
                    fontWeight: 'bold',
                    padding: '0.3rem 0.6rem',
                    backgroundColor: '#f8d7da',
                    color: '#dc3545',
                    borderRadius: '6px',
                  }}
                >
                  ${latestChartData.lower.toFixed(2)}
                </span>
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <StockChart
          summary={summary}
          eventMap={eventMap}
          // onHoverPriceChange is called by StockChart when the cursor hovers a point
          onHoverPriceChange={(data) => setHoverData(data)}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <GroupedStats summary={summary} />
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <AdvancedMetrics />
        </Grid>
        <Grid item xs={12} md={4}>
          <MarketSentiment />
        </Grid>
        <Grid item xs={12} md={4}>
          <NewsWidget />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainContent;
