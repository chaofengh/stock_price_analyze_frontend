// TickerList.js
import React, { useEffect, useState, useId } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  Tooltip,
  Avatar
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import { Area, AreaChart } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary } from '../Redux/summarySlice';
import { ensureLogoForSymbol, selectLogoUrlBySymbol } from '../Redux/logosSlice';
import { useNavigate } from 'react-router-dom';

function TrendCell({ closePrices }) {
  const theme = useTheme();
  const gradientId = `trend-${useId().replace(/:/g, '')}`;

  if (!closePrices || closePrices.length === 0) return null;
  const firstClose = closePrices[0];
  const lastClose = closePrices[closePrices.length - 1];
  const isUp = lastClose >= firstClose;
  const stroke = isUp ? theme.palette.success.main : theme.palette.error.main;
  const fillTop = alpha(stroke, 0.35);
  const fillBottom = alpha(stroke, 0.02);

  const data = closePrices.map((close, idx) => ({ idx, close }));

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <AreaChart width={140} height={36} data={data} margin={{ top: 6, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillTop} />
            <stop offset="100%" stopColor={fillBottom} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="close"
          stroke={stroke}
          fill={`url(#${gradientId})`}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </Box>
  );
}

function SymbolCell({ symbol }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const logoUrl = useSelector((state) => selectLogoUrlBySymbol(state, symbol));

  useEffect(() => {
    dispatch(ensureLogoForSymbol(symbol));
  }, [dispatch, symbol]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Avatar
        src={logoUrl || undefined}
        alt={symbol}
        sx={{
          width: 28,
          height: 28,
          bgcolor: alpha(theme.palette.common.white, 0.08),
          border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
        }}
        variant="rounded"
      >
        <Typography variant="caption" sx={{ color: 'text.secondaryBright', fontWeight: 800 }}>
          {symbol?.[0]?.toUpperCase() || '?'}
        </Typography>
      </Avatar>
      <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: 0.2 }} noWrap>
        {symbol}
      </Typography>
    </Box>
  );
}

function TickerList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, accessToken } = useSelector((state) => state.auth);
  const userId = user?.id ?? null;
  const isLoggedIn = Boolean(accessToken && userId);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'info', message: '' });

  useEffect(() => {
    // Re-fetch when userId changes.
    fetchData();
    // eslint-disable-next-line
  }, [userId]);

  const openLoginDialog = () => {
    window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'login' } }));
  };

  const requireLogin = (message) => {
    if (isLoggedIn) return true;
    setSnackbar({
      open: true,
      severity: 'info',
      message: message || 'Please sign in to update your watch list.',
    });
    return false;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Append user_id query parameter if available.
      const url = userId
        ? `${process.env.REACT_APP_summary_root_api}/tickers?user_id=${userId}`
        : `${process.env.REACT_APP_summary_root_api}/tickers`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const newRows = Object.entries(data)
        .map(([symbol, priceArray]) => {
          if (!priceArray || priceArray.length === 0) return null;

          const closePrices = priceArray.map(r => r.close);
          const firstClose = closePrices[0];
          const lastClose = closePrices[closePrices.length - 1];
          const percentageChange = ((lastClose - firstClose) / firstClose) * 100;

          return {
            id: symbol,
            symbol,
            closePrices,
            price: lastClose,
            percentageChange
          };
        })
        .filter(Boolean);

      setRows(newRows);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicker = async () => {
    if (!newTicker.trim()) return;
    if (!requireLogin('Sign in to add symbols to your watch list.')) return;
    try {
      setMutating(true);
      const response = await fetch(`${process.env.REACT_APP_summary_root_api}/tickers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ticker: newTicker.trim().toUpperCase() })
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setSnackbar({ open: true, severity: 'info', message: 'Please sign in to update your watch list.' });
          return;
        }
        throw new Error(`Failed to add ticker: ${response.status} ${response.statusText}`);
      }
      setNewTicker('');
      await fetchData();
    } catch (error) {
      console.error('Error adding ticker:', error);
      setSnackbar({ open: true, severity: 'error', message: 'Failed to add ticker. Please try again.' });
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteTicker = async (symbol) => {
    try {
      if (!requireLogin('Sign in to remove symbols from your watch list.')) return;
      setMutating(true);
      const response = await fetch(`${process.env.REACT_APP_summary_root_api}/tickers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ticker: symbol })
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setSnackbar({ open: true, severity: 'info', message: 'Please sign in to update your watch list.' });
          return;
        }
        throw new Error(`Failed to delete ticker: ${response.status} ${response.statusText}`);
      }
      await fetchData();
    } catch (error) {
      console.error('Error deleting ticker:', error);
      setSnackbar({ open: true, severity: 'error', message: 'Failed to delete ticker. Please try again.' });
    } finally {
      setMutating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (rowSelectionModel.length === 0) return;
    if (!requireLogin('Sign in to update your watch list.')) return;

    const symbols = rowSelectionModel.map(String);
    const ok = window.confirm(`Delete ${symbols.length} selected tickers from your watch list?`);
    if (!ok) return;

    setMutating(true);
    try {
      await Promise.all(
        symbols.map((symbol) =>
          fetch(`${process.env.REACT_APP_summary_root_api}/tickers`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, ticker: symbol }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed to delete ${symbol}`);
            return res;
          })
        )
      );
      setRowSelectionModel([]);
      await fetchData();
    } catch (error) {
      console.error('Error bulk deleting tickers:', error);
      setSnackbar({ open: true, severity: 'error', message: 'Failed to delete some tickers. Please try again.' });
    } finally {
      setMutating(false);
    }
  };

  const handleCellClick = (params) => {
    if (params.field === 'symbol') {
      dispatch(fetchSummary(params.value));
    }
  };

  const selectedSymbols = rowSelectionModel.map(String);
  const canAnalyze = selectedSymbols.length === 1;

  const columns = [
    {
      field: 'symbol',
      headerName: 'Ticker',
      flex: 1.1,
      sortable: true,
      renderCell: (params) => <SymbolCell symbol={params.value} />,
    },
    {
      field: 'price',
      headerName: 'Price',
      flex: 0.7,
      sortable: true,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) =>
        typeof value === 'number' ? `$${value.toFixed(2)}` : '',
    },
    {
      field: 'sparkline',
      headerName: 'Movement',
      flex: 1.1,
      sortable: false,
      renderCell: (params) => <TrendCell closePrices={params.row.closePrices} />,
    },
    {
      field: 'percentageChange',
      headerName: '%',
      flex: 0.7,
      sortable: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const value = params.value;
        if (typeof value !== 'number') return '';
        const isUp = value >= 0;
        const color = isUp ? theme.palette.success.main : theme.palette.error.main;
        const backgroundColor = alpha(color, 0.12);
        return (
          <Box
            sx={{
              color,
              backgroundColor,
              textAlign: 'right',
              borderRadius: 999,
              px: 1,
              fontWeight: 800,
              minWidth: 72,
            }}
          >
            {value.toFixed(2)}%
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 54,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title="Remove" placement="left">
          <span>
            <IconButton
              size="small"
              onClick={() => handleDeleteTicker(params.row.symbol)}
              disabled={mutating}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mt: 2,
        mx: 'auto',
        maxWidth: 600
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6">Watch List</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              if (!canAnalyze) return;
              const symbol = selectedSymbols[0];
              navigate(`/?symbol=${encodeURIComponent(symbol)}`);
            }}
            disabled={!canAnalyze}
          >
            Analyze
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleBulkDelete}
            disabled={mutating || selectedSymbols.length === 0}
            startIcon={<DeleteIcon />}
          >
            Delete ({selectedSymbols.length})
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => setRowSelectionModel([])}
            disabled={selectedSymbols.length === 0}
          >
            Clear
          </Button>
        </Stack>
      </Stack>

      {!isLoggedIn && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={openLoginDialog}
              startIcon={<LoginRoundedIcon />}
            >
              Sign in
            </Button>
          }
        >
          Sign in to add/remove tickers and keep your watch list synced.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          label="New Ticker"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddTicker();
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button variant="contained" onClick={handleAddTicker} disabled={loading || mutating}>
          ADD
        </Button>
      </Box>

      {loading && <Typography variant="body2">Loading...</Typography>}
      {!loading && rows.length === 0 && <Typography variant="body2">No tickers in the list.</Typography>}
      {!loading && rows.length > 0 && (
        <Box sx={{ width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            pageSizeOptions={[5, 10, 25, 100]}
            autoHeight
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
            onCellClick={handleCellClick}
            sx={{
              border: 'none',
              bgcolor: 'transparent',
              '& .MuiDataGrid-main, & .MuiDataGrid-virtualScroller, & .MuiDataGrid-overlayWrapper': {
                bgcolor: 'transparent',
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: alpha(theme.palette.common.white, 0.04),
                borderBottom: `1px solid ${theme.palette.divider}`,
                fontWeight: 800,
              },
              '& .MuiDataGrid-footerContainer': {
                bgcolor: 'transparent',
                borderTop: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.55)}`,
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
              '& .MuiCheckbox-root': { color: alpha(theme.palette.common.white, 0.55) },
              '& .MuiCheckbox-root.Mui-checked': { color: theme.palette.primary.main },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
              '& .MuiTablePagination-root': { color: theme.palette.text.secondaryBright },
            }}
          />
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          action={
            !isLoggedIn ? (
              <Button color="inherit" size="small" onClick={openLoginDialog}>
                Sign in
              </Button>
            ) : null
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default TickerList;
