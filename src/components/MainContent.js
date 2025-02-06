import React from 'react';
import { Box, Paper, Grid } from '@mui/material';
import StockChart from './StockChart';
import GroupedStats from './GroupedStats';
import AdvancedMetrics from './AdvancedMetrics';
import MarketSentiment from './MarketSentiment';
import NewsWidget from './NewsWidget';

const MainContent = ({ summary, eventMap }) => {
  return (
    <Box>
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
