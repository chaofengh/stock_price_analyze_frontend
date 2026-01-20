// OptionPriceRatio.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch } from 'react-redux';
import { fetchSummary } from '../Redux/summarySlice';

function OptionPriceRatio() {
  const dispatch = useDispatch();
  const itemsRef = useRef(new Map());
  const peRequestedRef = useRef(new Set());
  const bumpTimerRef = useRef(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });

  useEffect(() => {
    const scheduleBump = () => {
      if (bumpTimerRef.current) return;
      bumpTimerRef.current = setTimeout(() => {
        bumpTimerRef.current = null;
        setDataVersion((v) => v + 1);
      }, 50);
    };

    const reset = () => {
      itemsRef.current = new Map();
      peRequestedRef.current = new Set();
      scheduleBump();
    };

    const fetchFallback = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(`${process.env.REACT_APP_summary_root_api}/option-price-ratio`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch option price ratio.');
        }
        const result = await response.json();
        reset();
        result.forEach((item) => {
          if (item && item.ticker) itemsRef.current.set(item.ticker, item);
        });
        scheduleBump();
      } catch (err) {
        console.error('Error fetching option price ratio:', err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setFetchError(null);
    reset();

    const streamUrl = `${process.env.REACT_APP_summary_root_api}/option-price-ratio/stream`;
    let es;
    try {
      es = new EventSource(streamUrl);
    } catch (err) {
      fetchFallback();
      return () => {};
    }

    const onItem = (evt) => {
      try {
        const item = JSON.parse(evt.data);
        if (item && item.ticker) {
          itemsRef.current.set(item.ticker, item);
          scheduleBump();
        }
      } catch (e) {
        // ignore malformed events
      }
    };

    const onDone = () => {
      setLoading(false);
      es.close();
    };

    es.addEventListener('item', onItem);
    es.addEventListener('done', onDone);
    es.onerror = () => {
      es.close();
      fetchFallback();
    };

    return () => {
      es.close();
      if (bumpTimerRef.current) {
        clearTimeout(bumpTimerRef.current);
        bumpTimerRef.current = null;
      }
    };
  }, []);

  const data = useMemo(() => {
    void dataVersion;
    return Array.from(itemsRef.current.values());
  }, [dataVersion]);

  const rows = useMemo(() => {
    return data
      .filter((item) => !item.error)
      .map((item) => ({
        id: item.ticker,
        ticker: item.ticker,
        stockPrice: item.stock_price != null ? item.stock_price.toFixed(2) : null,
        ratio: item.best_put_ratio != null ? item.best_put_ratio.toFixed(4) : null,
        trailingPE: item.trailingPE != null ? item.trailingPE.toFixed(2) : null,
      }));
  }, [data]);

  useEffect(() => {
    if (!rows.length) return;

    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    const pageRows = rows.slice(start, end);

    const tickers = pageRows
      .map((r) => r.ticker)
      .filter((t) => t && !peRequestedRef.current.has(t));

    if (!tickers.length) return;

    tickers.forEach((t) => peRequestedRef.current.add(t));

    const url = `${process.env.REACT_APP_summary_root_api}/option-price-ratio/trailing-pe?tickers=${encodeURIComponent(
      tickers.join(',')
    )}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch trailing PE'))))
      .then((mapping) => {
        if (!mapping || typeof mapping !== 'object') return;
        Object.entries(mapping).forEach(([ticker, pe]) => {
          const item = itemsRef.current.get(ticker);
          if (item) item.trailingPE = pe;
        });
        setDataVersion((v) => v + 1);
      })
      .catch(() => {
        // keep PE blank on failures
      });
  }, [rows, paginationModel]);

  const handleCellClick = (params) => {
    if (params.field === 'ticker') {
      dispatch(fetchSummary(params.value));
    }
  };

  const columns = [
    {
      field: 'ticker',
      headerName: 'Ticker',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'stockPrice',
      headerName: 'Stock Price',
      flex: 1,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'ratio',
      headerName: 'Option-to-Price Ratio',
      flex: 1,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'trailingPE',
      headerName: 'Trailing PE',
      flex: 1,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
    }
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        width: '100%',
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

      {!fetchError && rows.length > 0 && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25]}
            disableSelectionOnClick
            onCellClick={handleCellClick}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-footerContainer': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          />
        </Box>
      )}

      {!loading && !fetchError && data.some(item => item.error) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" color="error">
            Some tickers returned errors:
          </Typography>
          {data.filter(item => item.error).map((item) => (
            <Typography key={item.ticker} variant="body2" color="error">
              {item.ticker}: {item.error}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default OptionPriceRatio;
