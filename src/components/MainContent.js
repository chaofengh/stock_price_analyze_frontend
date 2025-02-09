import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import StockChart from './StockChart';
import GroupedStats from './GroupedStats';
import AdvancedMetrics from './AdvancedMetrics';
import MarketSentiment from './MarketSentiment';
import NewsWidget from './NewsWidget';

const MainContent = ({ summary, eventMap }) => {
  // Determine price color based on the daily change.
  const priceChange = summary.price_change_in_dollars;
  const priceColor =
    priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'textPrimary';

  // Get the latest chart data entry (assuming date format is ISO-compliant)
  let latestChartData = null;
  if (summary && summary.chart_data && summary.chart_data.length > 0) {
    latestChartData = [...summary.chart_data].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
  }

  return (
    <Box>
      {summary && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" align="center">
            {summary.symbol ? summary.symbol : 'Company Name'} -{' '}
            <span style={{ color: priceColor }}>
              {summary.final_price != null
                ? `$${summary.final_price.toFixed(2)}`
                : ''}
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
                    backgroundColor: '#d4edda', // Light green
                    color: '#28a745', // Green
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
                    backgroundColor: '#f8d7da', // Light red
                    color: '#dc3545', // Red
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
        <StockChart summary={summary} eventMap={eventMap} />
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
