import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import SymbolSearch from './SymbolSearch';
import KpiTiles from './KpiTiles';
import AnnualFinancials from './AnnualFinancials';

const Sidebar = ({ summary, error, onSubmit }) => {

  const handleSelectSymbol = (symbol) => {
    if (onSubmit) {
      onSubmit(symbol);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
      <SymbolSearch onSelectSymbol={handleSelectSymbol} />

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {summary && (
        <Box>
          <KpiTiles summary={summary} />
          <Divider sx={{ my: 3 }} />
          <AnnualFinancials
            annualReports={
              summary.income_statement
                ? summary.income_statement.annualReports
                : []
            }
          />
          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Navigation
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Overview
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Technicals
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Fundamentals
            </Typography>
            <Typography variant="body2" color="textSecondary">
              News & Analysis
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Sidebar;
