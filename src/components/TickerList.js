import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  TextField,
  Paper
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import DeleteIcon from '@mui/icons-material/Delete';
import { Sparklines, SparklinesLine } from 'react-sparklines';

function TickerList() {
  const [tickerData, setTickerData] = useState({});
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // For adding new tickers
  const [newTicker, setNewTicker] = useState('');

  // Open the menu and fetch data
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchData();
  };

  // Close the menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Fetch tickers from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_summary_root_api}/tickers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setTickerData(data);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
    } finally {
      setLoading(false);
    }
  };

  // POST /api/tickers to add a new ticker
  const handleAddTicker = async () => {
    if (!newTicker.trim()) return; // ignore empty input

    try {
      const response = await fetch(`${process.env.REACT_APP_summary_root_api}/tickers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: newTicker.toUpperCase() })
      });
      if (!response.ok) {
        throw new Error(`Failed to add ticker: ${response.status} ${response.statusText}`);
      }
      setNewTicker('');      // clear input
      await fetchData();     // refresh ticker list
    } catch (error) {
      console.error('Error adding ticker:', error);
    }
  };

  // DELETE /api/tickers to remove a ticker
  const handleDeleteTicker = async (symbol) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_summary_root_api}/tickers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: symbol })
      });
      if (!response.ok) {
        throw new Error(`Failed to delete ticker: ${response.status} ${response.statusText}`);
      }
      await fetchData(); // refresh ticker list
    } catch (error) {
      console.error('Error deleting ticker:', error);
    }
  };

  return (
    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
      {/* Icon button (white icon) to open dropdown */}
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-controls={anchorEl ? 'ticker-menu' : undefined}
        aria-haspopup="true"
      >
        <ListIcon />
      </IconButton>

      {/* Optional: Show a small loading text next to the icon */}
      {loading && (
        <Typography variant="body2" sx={{ ml: 1 }}>
          Loading...
        </Typography>
      )}

      {/* The dropdown menu */}
      <Menu
        id="ticker-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        // Optionally fix the width or style further:
        // PaperProps={{ sx: { width: 400 } }}
      >
        {/* 1) "Add Ticker" row at the top of the dropdown */}
        <MenuItem
          // Prevent menu from closing when clicking this item
          onClick={(e) => e.stopPropagation()}
          disableRipple
          sx={{ pt: 1, pb: 1, display: 'block' }} // display block to hold form content
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              variant="outlined"
              size="small"
              label="New Ticker"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              sx={{flexGrow: 1}}
            />
            <Button variant="contained" onClick={(e) => {
              e.stopPropagation(); // keep menu open
              handleAddTicker();
            }}>
              Add
            </Button>
          </Box>
        </MenuItem>

        {/* 2) Ticker items */}
        {Object.entries(tickerData).map(([symbol, rows]) => {
          if (!rows || rows.length === 0) return null;

          const closePrices = rows.map((row) => row.close);
          const firstClose = closePrices[0];
          const lastClose = closePrices[closePrices.length - 1];
          const pctChange = ((lastClose - firstClose) / firstClose) * 100;

          return (
            <MenuItem
              key={symbol}
              // Prevent menu from closing on item click
              onClick={(e) => e.stopPropagation()}
              disableRipple
              sx={{ display: 'block', py: 1 }}
            >
              <Paper
                sx={{
                  p: 1,
                  display: 'grid',
                  gridTemplateColumns: '80px 80px 80px auto',
                  alignItems: 'center',
                  gap: 2
                }}
                elevation={0}
              >
                {/* Symbol */}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {symbol}
                </Typography>

                {/* Sparkline */}
                <Box sx={{ width: 60, height: 30 }}>
                  <Sparklines data={closePrices} width={60} height={30}>
                    <SparklinesLine color={pctChange >= 0 ? 'green' : 'red'} />
                  </Sparklines>
                </Box>

                {/* % Change */}
                <Typography
                  variant="caption"
                  sx={{
                    color: pctChange >= 0 ? '#28a745' : '#dc3545',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  {pctChange.toFixed(2)}%
                </Typography>

                {/* Delete icon */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation(); // keep menu open
                    handleDeleteTicker(symbol);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}

export default TickerList;
