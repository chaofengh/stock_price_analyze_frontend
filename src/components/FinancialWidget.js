import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const FinancialWidget = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Financial Statements
      </Typography>
      <Box sx={{ mt: 2, color: 'text.secondary' }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Coming Soon: Latest headlines, expert opinions, and financial news updates.
        </Typography>
      </Box>
    </Paper>
  );
};

export default FinancialWidget;
