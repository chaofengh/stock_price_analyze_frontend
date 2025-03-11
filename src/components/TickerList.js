import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
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
  const [open, setOpen] = useState(false);

  // For adding new tickers
  const [newTicker, setNewTicker] = useState('');

  const handleToggle = () => {
    // If we're about to open, fetch data
    if (!open) {
      fetchData();
    }
    setOpen((prev) => !prev);
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
        body: JSON.stringify({ ticker: newTicker.trim().toUpperCase() })
      });
      if (!response.ok) {
        throw new Error(`Failed to add ticker: ${response.status} ${response.statusText}`);
      }
      setNewTicker('');
      await fetchData(); // refresh ticker list
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
    <Box sx={{ position: 'relative' }}>
      {/* Icon button to toggle the list */}
      <IconButton
        color="inherit"
        onClick={handleToggle}
        aria-label="Open ticker list"
      >
        <ListIcon />
      </IconButton>

      {/* Optional loading text next to icon */}
      {loading && (
        <Typography variant="body2" sx={{ ml: 1 }}>
          Loading...
        </Typography>
      )}

      {open && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'absolute',
            top: 48,      // Adjust as needed so it sits below the icon
            right: 0,     // Pin to the right edge
            width: 380,   // Adjust to match your desired dropdown width
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 1,
            p: 1,
            zIndex: 9999, // Ensure it's on top of other elements

          }}
        >
          {/* Add-ticker row */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              variant="outlined"
              size="small"
              label="New Ticker"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              onClick={(e) => {
                e.stopPropagation(); // does nothing special here, but left for consistency
                handleAddTicker();
              }}
            >
              ADD
            </Button>
          </Box>

          {/* List of tickers */}
          {Object.entries(tickerData).map(([symbol, rows]) => {
            if (!rows || rows.length === 0) return null;

            const closePrices = rows.map((r) => r.close);
            const firstClose = closePrices[0];
            const lastClose = closePrices[closePrices.length - 1];
            const pctChange = ((lastClose - firstClose) / firstClose) * 100;

            return (
              <Paper
                key={symbol}
                sx={{
                  p: 1,
                  display: 'grid',
                  gridTemplateColumns: '80px 80px 80px 80px',
                  alignItems: 'center',
                  justifyItems: 'center',
                  gap: 1,
                  mb: 1, // spacing between items
                }}
                elevation={0}
                onClick={(e) => e.stopPropagation()}
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
                    e.stopPropagation();
                    handleDeleteTicker(symbol);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default TickerList;
