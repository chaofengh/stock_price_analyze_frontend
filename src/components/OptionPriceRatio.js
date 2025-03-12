import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

function OptionPriceRatio() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchOptionRatio = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(`${process.env.REACT_APP_summary_root_api}/option-price-ratio`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch option price ratio.');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching option price ratio:', err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOptionRatio();
  }, []);

  // Prepare rows for DataGrid
  const rows = data
    .filter(item => !item.error)
    .map((item, index) => ({
      id: index,
      ticker: item.ticker,
      stockPrice: item.stock_price ? item.stock_price.toFixed(2) : null,
      ratio: item.best_put_ratio ? item.best_put_ratio.toFixed(4) : null
    }));

  const columns = [
    { field: 'ticker', headerName: 'Ticker', flex: 1 },
    {
      field: 'stockPrice',
      headerName: 'Stock Price',
      flex: 1,
      type: 'number',
    },
    {
      field: 'ratio',
      headerName: 'Option-to-Price Ratio',
      flex: 1,
      type: 'number',
    }
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mt: 2,
        maxWidth: 500,
        // no margin auto or special alignment
      }}
    >
      <Typography variant="h6" gutterBottom>
        Option-to-Price Ratio
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress />
        </Box>
      )}

      {fetchError && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {fetchError}
        </Typography>
      )}

      {!loading && !fetchError && rows.length === 0 && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          No valid data found.
        </Typography>
      )}

      {!loading && !fetchError && rows.length > 0 && (
        <Box sx={{ height: 400, mt: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25]}
            disableSelectionOnClick
          />
        </Box>
      )}

      {/* Show any per-ticker errors */}
      {!loading && !fetchError && data.some(item => item.error) && (
        <Box sx={{ mt: 2}}>
          <Typography variant="subtitle1" color="error">
            Some tickers returned errors:
          </Typography>
          {data.filter(item => item.error).map((item, idx) => (
            <Typography key={idx} variant="body2" color="error">
              {item.ticker}: {item.error}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default OptionPriceRatio;
