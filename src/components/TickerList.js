// TickerList.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import { Sparklines, SparklinesLine } from 'react-sparklines';

// Helper cell renderer for sparkline
function SparklineCell({ closePrices }) {
  if (!closePrices || closePrices.length === 0) return null;
  const firstClose = closePrices[0];
  const lastClose = closePrices[closePrices.length - 1];
  const pctChange = ((lastClose - firstClose) / firstClose) * 100;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 60, height: 30 }}>
        <Sparklines data={closePrices} width={60} height={30}>
          <SparklinesLine color={pctChange >= 0 ? 'green' : 'red'} />
        </Sparklines>
      </Box>
    </Box>
  );
}

function TickerList() {
  const [tickerData, setTickerData] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTicker, setNewTicker] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_summary_root_api}/tickers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setTickerData(data);

      // Transform the object of arrays into rows for the DataGrid
      // Each "ticker" is a row, with closePrices, etc.
      const newRows = Object.entries(data).map(([symbol, priceArray], idx) => {
        if (!priceArray || priceArray.length === 0) return null;

        const closePrices = priceArray.map(r => r.close);
        const firstClose = closePrices[0];
        const lastClose = closePrices[closePrices.length - 1];
        const percentageChange = ((lastClose - firstClose) / firstClose) * 100;
        

        return {
          id: idx,
          symbol,
          closePrices,
          percentageChange
        };
      }).filter(Boolean);

      setRows(newRows);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicker = async () => {
    if (!newTicker.trim()) return;
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
      await fetchData();
    } catch (error) {
      console.error('Error adding ticker:', error);
    }
  };

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
      await fetchData();
    } catch (error) {
      console.error('Error deleting ticker:', error);
    }
  };

  // We’ll define DataGrid columns with custom renderers
  const columns = [
    {
      field: 'symbol',
      headerName: 'Symbol',
      flex: 1,
      sortable: true
    },
    {
      field: 'sparkline',
      headerName: 'Price Movement',
      flex: 2,
      sortable: false,
      renderCell: (params) => {
        return <SparklineCell closePrices={params.row.closePrices} />;
      }
    },
    {
      field: 'percentageChange',
      headerName: '% Change',
      flex: 1,
      sortable: true,
      renderCell: (params) => {
        // Grab the numeric value
        const value = params.value;
        if (typeof value !== 'number') return '';
    
        // Pick green or red
        const color = value >= 0 ? 'green' : 'red';
        const backgroundColor = value >= 0 ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)';
    
        // Format to 2 decimals + '%'
        return (
          <Box sx={{ color,backgroundColor,textAlign:'center' }}>
            {value.toFixed(2)}%
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleDeleteTicker(params.row.symbol)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )
    }
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mt: 2,
        width: '25vw',
        height: '80vh',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Watch List
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
          onClick={handleAddTicker}
          disabled={loading}
        >
          ADD
        </Button>
      </Box>

      {loading && (
        <Typography variant="body2">
          Loading...
        </Typography>
      )}

      {!loading && rows.length === 0 && (
        <Typography variant="body2">
          No tickers in the list.
        </Typography>
      )}

      {/* DataGrid for sorting */}
      {!loading && rows.length > 0 && (
        <Box sx={{ height: 400 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            disableSelectionOnClick
          />
        </Box>
      )}
    </Paper>
  );
}

export default TickerList;
