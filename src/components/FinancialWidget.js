// FinancialWidget.js => renamed or keep same. 
import React from 'react';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const FinancialWidget = ({ income_statement }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Financial Statements
      </Typography>
      <Box sx={{ mt: 2, color: 'text.secondary' }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Coming Soon: Latest headlines, expert opinions, and financial news updates.
        </Typography>

        {/* Button to navigate to the new analysis page */}
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/analysis"
          state={{ income_statement: income_statement }}
          // Depending on your React Router version,
          // you might pass data differently or store in Redux
        >
          View Detailed Financial Analysis
        </Button>
      </Box>
    </Paper>
  );
};

export default FinancialWidget;
