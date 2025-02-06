// MarketSentiment.js
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const MarketSentiment = () => {
  return (
    <Paper elevation={4} sx={{ p: 3, height: '200px' }}>
      <Typography variant="h6" gutterBottom>
        Market Sentiment
      </Typography>
      <Box sx={{ mt: 2, color: 'text.secondary' }}>
        <Typography variant="body2">
          Coming Soon: Analysis of investor sentiment, trending topics, and market mood.
        </Typography>
      </Box>
    </Paper>
  );
};

export default MarketSentiment;
