// AdvancedMetrics.js
import React from 'react';
import { Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdvancedMetrics = () => {
  const navigate = useNavigate();

  const handleOpenORB = () => {
    // Navigate to the new route
    navigate('/orb');
  };

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

      {/* Add a button that goes to the Opening Range Breakout page */}
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleOpenORB}>
          Go to Opening Range Breakout
        </Button>
      </Box>
    </Paper>
  );
};

export default AdvancedMetrics;
