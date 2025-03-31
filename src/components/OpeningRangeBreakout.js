// src/components/Advanced/OpeningRangeBreakout.js
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const OpeningRangeBreakout = () => {
  const [ticker, setTicker] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!ticker) return;
    setError(null);
    setResults([]);

    try {
      // Build the API endpoint using your .env variable
      const endpoint = `${process.env.REACT_APP_summary_root_api}/opening_range_breakout?ticker=${ticker}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unknown error occurred.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Opening Range Breakout Analysis
      </Typography>

      {/* Input field for Ticker */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          label="Enter Ticker"
          variant="outlined"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          sx={{ width: 200 }}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {/* Error message display */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Paper elevation={3} sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Results for {ticker}
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Scenario</TableCell>
                <TableCell>Win Rate</TableCell>
                <TableCell>Profit Factor</TableCell>
                <TableCell>Sharpe Ratio</TableCell>
                <TableCell>Max Drawdown</TableCell>
                <TableCell># Trades</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.scenario_name}</TableCell>
                  <TableCell>{item.win_rate}</TableCell>
                  <TableCell>{item.profit_factor}</TableCell>
                  <TableCell>{item.sharpe_ratio}</TableCell>
                  <TableCell>{item.max_drawdown}</TableCell>
                  <TableCell>{item.num_trades}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default OpeningRangeBreakout;
