// AdvancedMetrics.js
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const AdvancedMetrics = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Advanced Metrics
      </Typography>
      <Box sx={{ mt: 2, color: 'text.secondary' }}>
        <Typography variant="body2">
          Coming Soon: In-depth technical indicators, momentum analysis, and custom metrics.
        </Typography>
      </Box>
    </Paper>
  );
};

export default AdvancedMetrics;
