// TickerList.js
import React, { useCallback, useEffect, useRef, useState, useId } from 'react';
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
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DataGrid, gridClasses, useGridApiRef } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { Area, AreaChart } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary } from '../Redux/summarySlice';
import { ensureLogoForSymbol, selectLogoUrlBySymbol } from '../Redux/logosSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import { logout } from '../Redux/authSlice';
import {
  WATCHLIST_EXPERIMENT_FLAGS,
  getFeatureFlagVariantWithWait,
  isFlagVariantEnabled,
} from '../../analytics/experiments';

const DEFAULT_WATCHLIST_SUGGESTIONS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'];

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

  const min = Math.min(...closePrices);
  const max = Math.max(...closePrices);
  const range = max - min;
  const data = closePrices.map((close, idx) => ({
    idx,
    close,
    value: range === 0 ? 0.5 : (close - min) / range,
  }));

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <AreaChart width={140} height={40} data={data} margin={{ top: 6, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillTop} />
            <stop offset="100%" stopColor={fillBottom} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
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

function SymbolCell({ symbol, pending }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const logoUrl = useSelector((state) => selectLogoUrlBySymbol(state, symbol));

  useEffect(() => {
    dispatch(ensureLogoForSymbol(symbol));
  }, [dispatch, symbol]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1,
        height: '100%',
        minWidth: 0,
        width: '100%',
      }}
    >
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
      {pending && (
        <Chip
          size="small"
          label="Pending"
          sx={{
            height: 20,
            fontWeight: 800,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.warning.main, 0.16),
            color: theme.palette.warning.light,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
          }}
        />
      )}
    </Box>
  );
}

const STARTER_TICKERS = ['TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'META', 'PLTR', 'QQQ'];
const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});
const formatPrice = (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '');
const formatCompactNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? compactNumberFormatter.format(value) : '';

function WatchlistHeroGraphic({ variant = 'locked' }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 168,
        height: 168,
        borderRadius: 'var(--app-radius)',
        position: 'relative',
        overflow: 'hidden',
        background: `radial-gradient(120px 120px at 30% 30%, ${alpha(
          theme.palette.primary.main,
          0.45
        )}, transparent 60%),
          radial-gradient(120px 120px at 70% 70%, ${alpha(
            theme.palette.secondary.main,
            0.3
          )}, transparent 60%),
          ${alpha(theme.palette.common.white, 0.04)}`,
        border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: -60,
          background: `conic-gradient(from 180deg, ${alpha(
            theme.palette.primary.main,
            0.35
          )}, ${alpha(theme.palette.secondary.main, 0.45)}, ${alpha(
            theme.palette.primary.main,
            0.35
          )})`,
          filter: 'blur(22px)',
          opacity: 0.32,
          animation: 'breatheGlow 3.6s ease-in-out infinite',
          '@keyframes breatheGlow': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.28 },
            '50%': { transform: 'scale(1.04)', opacity: 0.42 },
          },
        }}
      />

      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: -80,
          background: `linear-gradient(120deg, transparent 40%, ${alpha(
            theme.palette.common.white,
            0.16
          )} 50%, transparent 60%)`,
          transform: 'translateX(-55%)',
          animation: 'glintSweep 1200ms ease-out 220ms both',
          '@keyframes glintSweep': {
            '0%': { transform: 'translateX(-55%)' },
            '100%': { transform: 'translateX(55%)' },
          },
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.common.white,
              0.16
            )}, ${alpha(theme.palette.common.white, 0.06)})`,
            border: `1px solid ${alpha(theme.palette.common.white, 0.16)}`,
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
          }}
        >
          {variant === 'locked' ? (
            <LockRoundedIcon sx={{ fontSize: 36, color: theme.palette.common.white }} />
          ) : (
            <EmojiEventsRoundedIcon sx={{ fontSize: 38, color: theme.palette.common.white }} />
          )}
          <AutoAwesomeRoundedIcon
            sx={{
              position: 'absolute',
              top: 10,
              right: 12,
              fontSize: 18,
              color: alpha(theme.palette.common.white, 0.85),
              animation: 'twinkle 2.8s ease-in-out infinite',
              '@keyframes twinkle': {
                '0%, 100%': { transform: 'scale(1)', opacity: 0.35 },
                '50%': { transform: 'scale(1.12)', opacity: 0.85 },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

function QuestLine({ done, label }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={(theme) => ({
          width: 10,
          height: 10,
          borderRadius: 999,
          bgcolor: done ? theme.palette.success.main : alpha(theme.palette.common.white, 0.25),
          boxShadow: done ? `0 0 0 4px ${alpha(theme.palette.success.main, 0.15)}` : 'none',
        })}
      />
      <Typography
        variant="body2"
        sx={(theme) => ({
          color: done ? theme.palette.text.primary : theme.palette.text.secondary,
          fontWeight: done ? 700 : 600,
        })}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function TickerList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const apiRef = useGridApiRef();
  const posthog = usePostHog();
  const { accessToken } = useSelector((state) => state.auth);
  const isLoggedIn = Boolean(accessToken);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'info', message: '' });
  const [watchlistSuggestionsEnabled, setWatchlistSuggestionsEnabled] = useState(false);
  const rowsLengthRef = useRef(0);
  const didCaptureEmptyStateRef = useRef(false);
  const watchlistStartRef = useRef(null);
  const addTickerInputRef = useRef(null);
  const dragSelectRef = useRef({
    active: false,
    anchorIndex: null,
    baseSelection: [],
    hasDragged: false,
    suppressClick: false,
  });

  useEffect(() => {
    if (!isLoggedIn) {
      setRows([]);
      setRowSelectionModel([]);
      setWatchlistSuggestionsEnabled(false);
      rowsLengthRef.current = 0;
      didCaptureEmptyStateRef.current = false;
      setHasFetched(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line
  }, [isLoggedIn, accessToken]);

  useEffect(() => {
    rowsLengthRef.current = Array.isArray(rows) ? rows.length : 0;
  }, [rows]);

  const WATCHLIST_BOUNCE_MS = Number(process.env.REACT_APP_WATCHLIST_BOUNCE_MS || 8000);
  const recordWatchlistExit = useCallback(
    (reason) => {
      if (!watchlistStartRef.current) return;
      const durationMs = Math.max(0, Date.now() - watchlistStartRef.current);
      const watchlistLength = rowsLengthRef.current;
      const isBounce = durationMs < WATCHLIST_BOUNCE_MS;
      posthog?.capture('watchlist_session_ended', {
        watchlist_length: Number.isFinite(watchlistLength) ? watchlistLength : null,
        route: location.pathname,
        duration_ms: durationMs,
        is_bounce: isBounce,
        exit_reason: reason || 'unknown',
      });
      watchlistStartRef.current = null;
    },
    [WATCHLIST_BOUNCE_MS, location.pathname, posthog]
  );

  useEffect(() => {
    const onWatchlist = location.pathname === '/watchlist';
    if (onWatchlist) {
      if (!watchlistStartRef.current) {
        watchlistStartRef.current = Date.now();
      }
      return;
    }
    if (watchlistStartRef.current) {
      recordWatchlistExit('route_change');
    }
  }, [location.pathname, recordWatchlistExit]);

  useEffect(() => () => {
    if (watchlistStartRef.current) {
      recordWatchlistExit('unmount');
    }
  }, [recordWatchlistExit]);

  useEffect(() => {
    const isEmptyState = isLoggedIn && hasFetched && !loading && rows.length === 0;
    if (!isEmptyState) {
      didCaptureEmptyStateRef.current = false;
      setWatchlistSuggestionsEnabled(false);
      return;
    }

    if (didCaptureEmptyStateRef.current) return;
    didCaptureEmptyStateRef.current = true;

    const flagKey = WATCHLIST_EXPERIMENT_FLAGS.suggestionsEmptyState;
    (async () => {
      // Best practice: explicitly evaluate the flag in the exact place the experiment runs.
      // This triggers $feature_flag_called for the correct flag.
      let flagValue = posthog?.getFeatureFlag?.(flagKey);
      if (flagValue === undefined) {
        flagValue = await getFeatureFlagVariantWithWait(posthog, flagKey, { timeoutMs: 2000 });
      }
      const enabled = isFlagVariantEnabled(flagValue, { defaultEnabled: false });
      setWatchlistSuggestionsEnabled(Boolean(enabled));
      posthog?.capture('watchlist_empty_state_viewed', {
        flag_key: flagKey,
        flag_value: flagValue ?? null,
        suggestions_enabled: Boolean(enabled),
      });
    })();
  }, [hasFetched, isLoggedIn, loading, posthog, rows.length]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (!dragSelectRef.current.active) return;
      dragSelectRef.current.active = false;
      if (dragSelectRef.current.hasDragged) {
        dragSelectRef.current.suppressClick = true;
        setTimeout(() => {
          dragSelectRef.current.suppressClick = false;
        }, 0);
      }
      dragSelectRef.current.hasDragged = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    const onRegistered = () => {
      setSnackbar({
        open: true,
        severity: 'success',
        message: 'Welcome! Your watch list is ready—add your first ticker to start.',
      });
    };
    window.addEventListener('auth:registered', onRegistered);
    return () => window.removeEventListener('auth:registered', onRegistered);
  }, []);

  const openAuthDialog = (mode = 'login') => {
    window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode } }));
  };

  const requireLogin = (message) => {
    if (isLoggedIn) return true;
    setSnackbar({
      open: true,
      severity: 'info',
      message: message || 'Sign in to save and update your watch list.',
    });
    return false;
  };

  const fetchData = async () => {
    if (!accessToken) {
      setLoading(false);
      return [];
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_summary_root_api}/tickers`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          dispatch(logout());
          setSnackbar({
            open: true,
            severity: 'info',
            message: 'Please sign in to view your watch list.',
          });
          setRows([]);
          return [];
        }
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const newRows = Object.entries(data)
        .map(([symbol, payload]) => {
          const candles = Array.isArray(payload) ? payload : payload?.candles;
          const summary = Array.isArray(payload) ? null : payload?.summary;

          if (!candles || candles.length === 0) {
            return {
              id: symbol,
              symbol,
              closePrices: [],
              price: null,
              open: null,
              close: null,
              prevClose: null,
              volume: null,
              change: null,
              percentageChange: null,
              pending: true,
            };
          }

          const normalizedCandles = candles.map((row) => ({
            ...row,
            open: Number(row?.open),
            close: Number(row?.close),
            volume: Number(row?.volume),
          }));

          let closePrices = normalizedCandles
            .map((row) => row.close)
            .filter((value) => Number.isFinite(value));

          const summaryOpen = Number.isFinite(Number(summary?.open)) ? Number(summary.open) : null;
          const summaryClose = Number.isFinite(Number(summary?.close)) ? Number(summary.close) : null;
          const summaryPrevClose = Number.isFinite(Number(summary?.previousClose))
            ? Number(summary.previousClose)
            : Number.isFinite(Number(summary?.prevClose))
            ? Number(summary.prevClose)
            : null;

          let open = null;
          for (const candle of normalizedCandles) {
            if (Number.isFinite(candle.open)) {
              open = candle.open;
              break;
            }
            if (Number.isFinite(candle.close)) {
              open = candle.close;
              break;
            }
          }
          if (!Number.isFinite(open)) {
            open = summaryOpen;
          }

          let close = null;
          for (let i = normalizedCandles.length - 1; i >= 0; i -= 1) {
            const candle = normalizedCandles[i];
            if (Number.isFinite(candle.close)) {
              close = candle.close;
              break;
            }
            if (Number.isFinite(candle.open)) {
              close = candle.open;
              break;
            }
          }
          if (!Number.isFinite(close)) {
            close = summaryClose;
          }

          const previousClose = summaryPrevClose;

          const volumeValues = normalizedCandles
            .map((row) => row.volume)
            .filter((value) => Number.isFinite(value));
          const volume = volumeValues.length
            ? volumeValues.reduce((sum, value) => sum + value, 0)
            : null;

          const change =
            Number.isFinite(previousClose) && Number.isFinite(close)
              ? close - previousClose
              : null;
          const percentageChange =
            Number.isFinite(previousClose) && Number.isFinite(close) && previousClose !== 0
              ? ((close - previousClose) / previousClose) * 100
              : null;

          if (closePrices.length < 2) {
            if (Number.isFinite(open) && Number.isFinite(close)) {
              closePrices = [open, close];
            } else if (closePrices.length === 1) {
              closePrices = [closePrices[0], closePrices[0]];
            }
          }

          return {
            id: symbol,
            symbol,
            closePrices,
            price: Number.isFinite(close) ? close : null,
            open: Number.isFinite(open) ? open : null,
            close: Number.isFinite(close) ? close : null,
            prevClose: Number.isFinite(previousClose) ? previousClose : null,
            volume: Number.isFinite(volume) ? volume : null,
            change,
            percentageChange,
            pending: false,
          };
        })
        .filter(Boolean);

      setRows(newRows);
      return newRows;
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      posthog?.capture('watchlist_error', {
        action: 'fetch',
        message: error?.message || String(error),
      });
      return [];
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  const handleAddTicker = async (tickerOverride, options = {}) => {
    const { method = 'button' } = options;
    const symbol = (tickerOverride ?? newTicker).trim().toUpperCase();
    if (!symbol) return;
    if (!requireLogin('Sign in to add tickers to your watch list.')) return;
    const previousCount = rows.length;
    try {
      setMutating(true);
      const response = await fetch(`${process.env.REACT_APP_summary_root_api}/tickers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ticker: symbol })
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setSnackbar({ open: true, severity: 'info', message: 'Please sign in to update your watch list.' });
          dispatch(logout());
          return;
        }
        throw new Error(`Failed to add ticker: ${response.status} ${response.statusText}`);
      }
      setNewTicker('');
      const newRows = await fetchData();
      const nextCount = Array.isArray(newRows) ? newRows.length : rows.length;
      const unlockedFirst = previousCount === 0 && nextCount >= 1;
      const unlockedThree = previousCount < 3 && nextCount >= 3;
      posthog?.capture('watchlist_ticker_added', {
        symbol,
        method,
        is_first_watchlist_ticker: unlockedFirst,
        watchlist_count_after: nextCount,
      });
      setSnackbar({
        open: true,
        severity: 'success',
        message: unlockedFirst
          ? `Nice work — your first ticker (${symbol}) is on the list.`
          : unlockedThree
          ? `Level up! You now have ${nextCount} tickers on your watch list.`
          : `Added ${symbol} to your watch list.`,
      });

    } catch (error) {
      console.error('Error adding ticker:', error);
      posthog?.capture('watchlist_error', {
        action: 'add',
        symbol,
        message: error?.message || String(error),
      });
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ticker: symbol })
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setSnackbar({ open: true, severity: 'info', message: 'Please sign in to update your watch list.' });
          dispatch(logout());
          return;
        }
        throw new Error(`Failed to delete ticker: ${response.status} ${response.statusText}`);
      }
      await fetchData();
    } catch (error) {
      console.error('Error deleting ticker:', error);
      posthog?.capture('watchlist_error', {
        action: 'remove',
        symbol,
        message: error?.message || String(error),
      });
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
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ ticker: symbol }),
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
    if (dragSelectRef.current.suppressClick) {
      return;
    }
    if (params.field === 'symbol') {
      dispatch(fetchSummary(params.value));
    }
  };

  const getSortedRowIds = () => {
    const sorted = apiRef.current?.getSortedRowIds?.();
    if (Array.isArray(sorted) && sorted.length > 0) {
      return sorted;
    }
    return rows.map((row) => row.id);
  };

  const isInteractiveCell = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    const cell = target.closest(`.${gridClasses.cell}`);
    const field = cell?.getAttribute('data-field');
    if (field === '__check__') return false;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return true;
    return field === 'actions';
  };

  const handleRowMouseDown = (event) => {
    if (event.button !== 0) return;
    if (isInteractiveCell(event)) return;

    const rowIndex = Number(event.currentTarget?.dataset?.rowindex);
    if (Number.isNaN(rowIndex)) return;
    const cell = event.target?.closest?.(`.${gridClasses.cell}`);
    const field = cell?.getAttribute?.('data-field');
    const isCheckboxCell = field === '__check__';

    const additive = event.ctrlKey || event.metaKey || event.shiftKey;
    const baseSelection = additive ? rowSelectionModel : [];
    dragSelectRef.current = {
      active: true,
      anchorIndex: rowIndex,
      baseSelection,
      hasDragged: false,
      suppressClick: false,
    };

    if (!isCheckboxCell) {
      const sortedIds = getSortedRowIds();
      const anchorId = sortedIds[rowIndex];
      if (anchorId !== undefined) {
        const nextSelection = additive
          ? Array.from(new Set([...baseSelection, anchorId]))
          : [anchorId];
        setRowSelectionModel(nextSelection);
      }
      event.preventDefault();
    }
  };

  const handleRowMouseEnter = (event) => {
    if (!dragSelectRef.current.active) return;
    const rowIndex = Number(event.currentTarget?.dataset?.rowindex);
    if (Number.isNaN(rowIndex)) return;

    const anchorIndex = dragSelectRef.current.anchorIndex;
    if (anchorIndex === null) return;
    if (rowIndex !== anchorIndex) {
      dragSelectRef.current.hasDragged = true;
    }

    const sortedIds = getSortedRowIds();
    const start = Math.min(anchorIndex, rowIndex);
    const end = Math.max(anchorIndex, rowIndex);
    const rangeIds = sortedIds.slice(start, end + 1);
    const merged = dragSelectRef.current.baseSelection.length
      ? Array.from(new Set([...dragSelectRef.current.baseSelection, ...rangeIds]))
      : rangeIds;
    setRowSelectionModel(merged);
  };

  const selectedSymbols = rowSelectionModel.map(String);
  const canAnalyze = selectedSymbols.length === 1;
  const pendingCount = rows.filter((row) => row.pending).length;

  const columns = [
    {
      field: 'symbol',
      headerName: 'Ticker',
      flex: 0.75,
      minWidth: 180,
      maxWidth: 240,
      sortable: true,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => <SymbolCell symbol={params.value} pending={params.row.pending} />,
    },
    {
      field: 'price',
      headerName: 'Last',
      flex: 0.7,
      minWidth: 110,
      sortable: true,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) => formatPrice(value),
    },
    {
      field: 'change',
      headerName: 'Change',
      flex: 0.7,
      minWidth: 120,
      sortable: true,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const value = params.value;
        if (typeof value !== 'number') return '';
        const isUp = value >= 0;
        const sign = value > 0 ? '+' : value < 0 ? '-' : '';
        const absValue = Math.abs(value);
        const color = isUp ? theme.palette.success.main : theme.palette.error.main;
        const backgroundColor = alpha(color, 0.12);
        return (
          <Box
            sx={{
              color,
              backgroundColor,
              textAlign: 'center',
              borderRadius: 999,
              px: 1,
              fontWeight: 800,
              minWidth: 80,
            }}
          >
            {sign}
            {`$${absValue.toFixed(2)}`}
          </Box>
        );
      },
    },
    {
      field: 'percentageChange',
      headerName: 'Change %',
      flex: 0.7,
      minWidth: 120,
      sortable: true,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
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
              textAlign: 'center',
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
      field: 'prevClose',
      headerName: 'Prev Close',
      flex: 0.7,
      minWidth: 120,
      sortable: true,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) => formatPrice(value),
    },
    {
      field: 'open',
      headerName: 'Open',
      flex: 0.7,
      minWidth: 110,
      sortable: true,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) => formatPrice(value),
    },
    {
      field: 'volume',
      headerName: 'Volume',
      flex: 0.8,
      minWidth: 120,
      sortable: true,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) => formatCompactNumber(value),
    },
    {
      field: 'sparkline',
      headerName: 'Movement',
      flex: 1.1,
      minWidth: 160,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <TrendCell closePrices={params.row.closePrices} />,
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

  const questProgress = Math.min((rows.length / 5) * 100, 100);
  const showQuest = isLoggedIn && !loading && rows.length < 5;

  return (
    <Paper
      elevation={3}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, md: 3 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!isLoggedIn ? (
        <Stack
          spacing={2.5}
          sx={{
            position: 'relative',
            height: '100%',
            animation: 'treasureReveal 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
            '@keyframes treasureReveal': {
              '0%': { opacity: 0, transform: 'translateY(10px)' },
              '100%': { opacity: 1, transform: 'translateY(0px)' },
            },
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 'var(--app-radius)',
              bgcolor: alpha(theme.palette.warning.main, 0.05),
              borderColor: alpha(theme.palette.warning.main, 0.18),
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                inset: -140,
                background: `radial-gradient(180px 180px at 30% 20%, ${alpha(
                  theme.palette.warning.main,
                  0.16
                )}, transparent 60%),
                  radial-gradient(220px 220px at 70% 80%, ${alpha(
                    theme.palette.secondary.main,
                    0.12
                  )}, transparent 60%)`,
                filter: 'blur(14px)',
                opacity: 0.7,
                pointerEvents: 'none',
              }}
            />

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              sx={{ position: 'relative' }}
            >
              <WatchlistHeroGraphic />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', fontWeight: 900, letterSpacing: 0.8 }}
                >
                  Your watch list
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.2, mt: 0.25 }}>
                  Let’s save your picks
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, maxWidth: 520 }}>
                  Sign in to keep your tickers in one place, synced across devices, and ready whenever you are.
                </Typography>
                <Stack spacing={0.75} sx={{ mt: 2 }}>
                  <QuestLine done={false} label="Create your free account" />
                  <QuestLine done={false} label="Add your first ticker" />
                  <QuestLine done={false} label="Come back anytime — we’ll remember" />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2.25 }}>
                  <Button
                    variant="contained"
                    onClick={() => openAuthDialog('register')}
                    startIcon={<PersonAddAltRoundedIcon />}
                    sx={{ fontWeight: 900 }}
                  >
                    Create account
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => openAuthDialog('login')}
                    startIcon={<LoginRoundedIcon />}
                    sx={{ fontWeight: 800 }}
                  >
                    Sign in
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      ) : (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">Watch List</Typography>
              {pendingCount > 0 && (
                <Chip
                  size="small"
                  label={`Pending data: ${pendingCount}`}
                  sx={{
                    fontWeight: 800,
                    bgcolor: alpha(theme.palette.warning.main, 0.16),
                    color: theme.palette.warning.light,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                  }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (!canAnalyze) return;
                  const symbol = selectedSymbols[0];
                  navigate(`/?symbol=${encodeURIComponent(symbol)}`, { state: { source: 'watchlist' } });
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

          {showQuest && (
            <Box sx={{ mb: 2 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 'var(--app-radius)',
                  bgcolor: alpha(theme.palette.common.white, 0.03),
                  borderColor: alpha(theme.palette.common.white, 0.1),
                }}
              >
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmojiEventsRoundedIcon sx={{ color: theme.palette.secondary.main }} />
                      <Typography sx={{ fontWeight: 900 }}>Quest: Build your watch list</Typography>
                    </Stack>
                    <Chip
                      size="small"
                      icon={<AutoAwesomeRoundedIcon />}
                      label={`${rows.length}/5`}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.14),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                        color: theme.palette.text.primary,
                        fontWeight: 900,
                      }}
                    />
                  </Stack>

                  <Stack spacing={0.75}>
                    <QuestLine done={rows.length >= 1} label="Add your first ticker" />
                    <QuestLine done={rows.length >= 3} label="Add 3 tickers" />
                    <QuestLine done={rows.length >= 5} label="Add 5 tickers" />
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={questProgress}
                    sx={{
                      height: 10,
                      borderRadius: 999,
                      bgcolor: alpha(theme.palette.common.white, 0.08),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      },
                    }}
                  />

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }} useFlexGap>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                      Starter picks:
                    </Typography>
                    {STARTER_TICKERS.map((symbol) => (
                      <Chip
                        key={symbol}
                        label={symbol}
                        size="small"
                        onClick={() => handleAddTicker(symbol, { method: 'suggested' })}
                        disabled={mutating}
                        sx={{
                          bgcolor: alpha(theme.palette.common.white, 0.06),
                          fontWeight: 900,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              label="Add a ticker"
              inputRef={addTickerInputRef}
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTicker(undefined, { method: 'button' });
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              onClick={() => handleAddTicker(undefined, { method: 'button' })}
              disabled={loading || mutating}
            >
              ADD
            </Button>
          </Box>

          {loading && <Typography variant="body2">Loading...</Typography>}
          {!loading && rows.length === 0 && (
            <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center' }}>
              {watchlistSuggestionsEnabled ? (
                <Box sx={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                    Start your watch list
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Here are a few popular tickers to get you going.
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
                    {DEFAULT_WATCHLIST_SUGGESTIONS.map((ticker) => (
                      <Chip
                        key={ticker}
                        label={ticker}
                        clickable
                        onClick={() => {
                          posthog?.capture('watchlist_suggestion_clicked', { symbol: ticker });
                          handleAddTicker(ticker, { method: 'suggestion' });
                        }}
                        sx={{ fontWeight: 800 }}
                      />
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  Your watch list is empty. Add a ticker to get started.
                </Typography>
              )}
            </Box>
          )}
          {!loading && rows.length > 0 && (
            <Box sx={{ width: '100%', flex: 1, minHeight: 0 }}>
              <DataGrid
                apiRef={apiRef}
                rows={rows}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                slotProps={{
                  row: {
                    onMouseDown: handleRowMouseDown,
                    onMouseEnter: handleRowMouseEnter,
                  },
                }}
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
                onCellClick={handleCellClick}
                sx={{
                  height: '100%',
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
                  '& .MuiDataGrid-columnHeader--alignCenter .MuiDataGrid-columnHeaderTitleContainer': {
                    justifyContent: 'center',
                  },
                  '& .MuiDataGrid-columnHeader--alignLeft .MuiDataGrid-columnHeaderTitleContainer': {
                    justifyContent: 'flex-start',
                  },
                  '& .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderTitleContainer': {
                    justifyContent: 'flex-end',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    bgcolor: 'transparent',
                    borderTop: `1px solid ${theme.palette.divider}`,
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
                  '& .MuiDataGrid-row:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                  '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cellCheckbox': {
                    alignItems: 'center',
                  },
                  '& .MuiCheckbox-root': { color: alpha(theme.palette.common.white, 0.55) },
                  '& .MuiCheckbox-root.Mui-checked': { color: theme.palette.primary.main },
                  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
                  '& .MuiTablePagination-root': { color: theme.palette.text.secondaryBright },
                }}
              />
            </Box>
          )}
        </>
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
              <Button color="inherit" size="small" onClick={() => openAuthDialog('login')}>
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
