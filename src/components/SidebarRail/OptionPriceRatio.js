// OptionPriceRatio.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary } from '../Redux/summarySlice';
import { logout } from '../Redux/authSlice';

function OptionPriceRatio() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const accessToken = useSelector((s) => s.auth.accessToken);
  const itemsRef = useRef(new Map());
  const bumpTimerRef = useRef(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const openAuthDialog = (mode = 'login') => {
    window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode } }));
  };

  const scheduleBump = () => {
    if (bumpTimerRef.current) return;
    bumpTimerRef.current = setTimeout(() => {
      bumpTimerRef.current = null;
      setDataVersion((v) => v + 1);
    }, 50);
  };

  const resetItems = () => {
    itemsRef.current = new Map();
    scheduleBump();
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const applyItem = (item) => {
      if (!isMounted || !item || !item.ticker) return;
      itemsRef.current.set(item.ticker, item);
      scheduleBump();
    };

    const fetchFallback = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(`${process.env.REACT_APP_summary_root_api}/option-price-ratio`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            dispatch(logout());
            throw new Error('Please sign in to view your watch list.');
          }
          let errPayload = null;
          try {
            errPayload = await response.json();
          } catch (err) {
            errPayload = null;
          }
          throw new Error(errPayload?.error || 'Failed to fetch option price ratio.');
        }
        const data = await response.json();
        resetItems();
        if (Array.isArray(data)) {
          data.forEach((item) => applyItem(item));
        }
      } catch (err) {
        if (!isMounted || controller.signal.aborted) return;
        setFetchError(err.message);
      } finally {
        if (!isMounted || controller.signal.aborted) return;
        setLoading(false);
      }
    };

    const runStream = async () => {
      setLoading(true);
      setFetchError(null);
      resetItems();
      try {
        const response = await fetch(`${process.env.REACT_APP_summary_root_api}/option-price-ratio/stream`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            dispatch(logout());
            throw new Error('Please sign in to view your watch list.');
          }
          let errPayload = null;
          try {
            errPayload = await response.json();
          } catch (err) {
            errPayload = null;
          }
          throw new Error(errPayload?.error || 'Failed to stream option price ratio.');
        }

        if (!response.body || !response.body.getReader) {
          throw new Error('Streaming not supported.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let doneReceived = false;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';
          for (const chunk of chunks) {
            const lines = chunk.split('\n');
            let eventName = 'message';
            let dataPayload = '';
            for (const line of lines) {
              if (!line || line.startsWith(':')) continue;
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
                continue;
              }
              if (line.startsWith('data:')) {
                const value = line.slice(5).trim();
                dataPayload = dataPayload ? `${dataPayload}\n${value}` : value;
              }
            }
            if (!dataPayload && eventName === 'message') {
              continue;
            }
            let parsed = null;
            if (dataPayload) {
              try {
                parsed = JSON.parse(dataPayload);
              } catch (err) {
                parsed = null;
              }
            }
            if (eventName === 'item' && parsed) {
              applyItem(parsed);
              if (isMounted) setLoading(false);
            } else if (eventName === 'pe' && parsed) {
              if (!parsed.ticker) continue;
              const existing = itemsRef.current.get(parsed.ticker) || { ticker: parsed.ticker };
              existing.trailingPE = parsed.trailingPE;
              itemsRef.current.set(parsed.ticker, existing);
              scheduleBump();
            } else if (eventName === 'ratio_done') {
              if (isMounted) setLoading(false);
            } else if (eventName === 'done') {
              doneReceived = true;
              if (isMounted) setLoading(false);
            }
          }
          if (doneReceived) break;
        }
        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted || controller.signal.aborted) return;
        await fetchFallback();
      }
    };

    if (!accessToken) {
      resetItems();
      setFetchError(null);
      setLoading(false);
      return () => {
        isMounted = false;
        controller.abort();
        if (bumpTimerRef.current) {
          clearTimeout(bumpTimerRef.current);
          bumpTimerRef.current = null;
        }
      };
    }

    runStream();

    return () => {
      isMounted = false;
      controller.abort();
      if (bumpTimerRef.current) {
        clearTimeout(bumpTimerRef.current);
        bumpTimerRef.current = null;
      }
    };
  }, [accessToken, dispatch]);

  const expirationLabel = useMemo(() => {
    const item = Array.from(itemsRef.current.values()).find((entry) => entry && entry.expiration);
    return item?.expiration || null;
  }, [dataVersion]);

  const items = useMemo(() => {
    void dataVersion;
    return Array.from(itemsRef.current.values());
  }, [dataVersion]);

  const errorItems = useMemo(() => items.filter((item) => item?.error), [items]);

  const rows = useMemo(() => {
    const okItems = items.filter((item) => item && !item.error);
    const sorted = [...okItems].sort((a, b) => {
      const aRatio = Number.isFinite(a.best_put_ratio) ? a.best_put_ratio : -1;
      const bRatio = Number.isFinite(b.best_put_ratio) ? b.best_put_ratio : -1;
      return bRatio - aRatio;
    });

    const formatNumber = (value, digits) => {
      const num = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(num) ? num.toFixed(digits) : null;
    };

    return sorted.map((item) => ({
      id: item.ticker,
      ticker: item.ticker,
      logoBase64: item.logo_base64,
      stockPrice: formatNumber(item.stock_price, 2),
      ratio: formatNumber(item.best_put_ratio, 4),
      trailingPE: formatNumber(item.trailingPE, 2),
    }));
  }, [items]);

  const resolveLogoSrc = (logoBase64) => {
    if (!logoBase64) return null;
    if (logoBase64.startsWith('data:')) return logoBase64;
    return `data:image/png;base64,${logoBase64}`;
  };

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
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        const src = resolveLogoSrc(params.row.logoBase64);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
            <Avatar
              src={src || undefined}
              alt={params.value}
              sx={{
                width: 28,
                height: 28,
                bgcolor: alpha(theme.palette.common.white, 0.08),
                border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
              }}
              variant="rounded"
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                {params.value?.[0]?.toUpperCase() || '?'}
              </Typography>
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: 0.2 }} noWrap>
              {params.value}
            </Typography>
          </Box>
        );
      },
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
    },
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

      {expirationLabel && (
        <Typography variant="body2" color="text.secondary">
          Expiration: {expirationLabel}
        </Typography>
      )}

      {!accessToken && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Sign in to view option-to-price ratios for your watch list.
          </Typography>
          <Button variant="contained" onClick={() => openAuthDialog('login')}>
            Sign in
          </Button>
        </Box>
      )}

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

      {!loading && !fetchError && accessToken && rows.length === 0 && (
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
            pageSizeOptions={[5, 10, 25, 50]}
            disableSelectionOnClick
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
              '& .MuiDataGrid-row:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.55)}`,
                alignItems: 'center',
              },
              '& .MuiDataGrid-cell--textCenter': {
                justifyContent: 'center',
              },
              '& .MuiDataGrid-cell--textLeft': {
                justifyContent: 'flex-start',
              },
              '& .MuiDataGrid-cell--textRight': {
                justifyContent: 'flex-end',
              },
              '& .MuiDataGrid-columnHeader': {
                alignItems: 'center',
              },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
              '& .MuiTablePagination-root': { color: theme.palette.text.secondaryBright },
            }}
          />
        </Box>
      )}

      {!loading && !fetchError && errorItems.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" color="error">
            Some tickers returned errors:
          </Typography>
          {errorItems.map((item) => (
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
