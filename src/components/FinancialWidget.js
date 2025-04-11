import React from 'react';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const FinancialWidget = ({ income_statement }) => {
  // For the example, let's read the symbol directly from income_statement
  const symbol = income_statement?.symbol || 'UNKNOWN';

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Financial Statements
      </Typography>
      <Box sx={{ mt: 2, color: 'text.secondary' }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Coming Soon: Latest headlines, expert opinions, and financial news updates.
        </Typography>

        {/* Button to navigate to /analysis/META (for example). */}
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to={`/analysis/${symbol}`}
          // If you still want to pass the income statement via route state:
          state={{ income_statement }}
        >
          View Detailed Financial Analysis
        </Button>
      </Box>
    </Paper>
  );
};

export default FinancialWidget;
