import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider
} from '@mui/material';
import SymbolSearch from './SymbolSearch';
import KpiTiles from './KpiTiles';

const Sidebar = ({ summary, error, onSubmit }) => {
  // If you'd like, you can store the selected symbol in this component's state:
  const [selectedSymbol, setSelectedSymbol] = useState('');

  const handleSelectSymbol = (symbol) => {
    // Save the symbol in state if desired
    setSelectedSymbol(symbol);
    // Optionally call the parent's onSubmit if you want to fetch summary/fundamentals
    if (onSubmit) {
      onSubmit(symbol);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
      {/* The new SymbolSearch component */}
      <SymbolSearch onSelectSymbol={handleSelectSymbol} />

      {/* Display any errors */}
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Display the summary if it exists */}
      {summary && (
        <Box>
          <KpiTiles summary={summary} />
          <Divider sx={{ my: 3 }} />
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Fundamentals
            </Typography>
            <Typography variant="body2">
              <strong>Trailing PE:</strong> {summary.trailingPE ?? '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Forward PE:</strong> {summary.forwardPE ?? '-'}
            </Typography>
            <Typography variant="body2">
              <strong>PEG:</strong> {summary.PEG ?? '-'}
            </Typography>
            <Typography variant="body2">
              <strong>PGI:</strong> {summary.PGI ?? '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Dividend Yield:</strong> {summary.dividendYield ?? '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Beta:</strong> {summary.beta ?? '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Market Cap:</strong> {summary.marketCap ?? '-'}
            </Typography>
          </Box>
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
