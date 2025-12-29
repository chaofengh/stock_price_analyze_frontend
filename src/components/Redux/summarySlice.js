// src/redux/summarySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchStockSummary,
  fetchStockPeers,
  fetchStockFundamentals,
  fetchStockPeerAverages,
} from '../../API/StockService';

// Thunk to fetch summary data
export const fetchSummary = createAsyncThunk(
  'summary/fetchSummary',
  async (symbol, { dispatch, rejectWithValue }) => {
    try {
      const data = await fetchStockSummary(symbol);
      if (data?.status === 'pending') {
        const retryMs = Math.max(500, Number(data?.retry_after_seconds || 1) * 1000);
        setTimeout(() => {
          dispatch(fetchSummary(symbol));
        }, retryMs);
      }
      return data;
    } catch (err) {
      // If using server errors, adapt as needed:
      // return rejectWithValue(err.response.data);
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (symbol, { getState }) => {
      const normalized = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';
      if (!normalized) return false;

      const { summary } = getState();
      const currentSymbol =
        typeof summary?.currentSymbol === 'string'
          ? summary.currentSymbol.trim().toUpperCase()
          : '';
      const loadedSymbol =
        typeof summary?.data?.symbol === 'string'
          ? summary.data.symbol.trim().toUpperCase()
          : '';
      const isPending = summary?.data?.status === 'pending';

      if (summary?.loading && currentSymbol === normalized && !isPending) {
        return false;
      }

      if (loadedSymbol === normalized && !isPending) {
        return false;
      }

      return true;
    },
  }
);

export const fetchSummaryPeers = createAsyncThunk(
  'summary/fetchSummaryPeers',
  async (symbol, { dispatch, rejectWithValue }) => {
    try {
      const data = await fetchStockPeers(symbol);
      if (data?.status === 'pending') {
        const retryMs = Math.max(500, Number(data?.retry_after_seconds || 1) * 1000);
        setTimeout(() => {
          dispatch(fetchSummaryPeers(symbol));
        }, retryMs);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (symbol, { getState }) => {
      const normalized = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';
      if (!normalized) return false;

      const { summary } = getState();
      const loadedSymbol =
        typeof summary?.data?.symbol === 'string'
          ? summary.data.symbol.trim().toUpperCase()
          : '';

      if (loadedSymbol !== normalized) {
        return false;
      }

      if (summary?.peerLoading && summary?.peerSymbol === normalized) {
        return false;
      }

      if (summary?.peerSymbol === normalized) {
        return false;
      }

      return true;
    },
  }
);

export const fetchSummaryFundamentals = createAsyncThunk(
  'summary/fetchSummaryFundamentals',
  async (symbol, { dispatch, rejectWithValue }) => {
    try {
      const data = await fetchStockFundamentals(symbol);
      if (data?.status === 'pending') {
        const retryMs = Math.max(500, Number(data?.retry_after_seconds || 1) * 1000);
        setTimeout(() => {
          dispatch(fetchSummaryFundamentals(symbol));
        }, retryMs);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (symbol, { getState }) => {
      const normalized = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';
      if (!normalized) return false;

      const { summary } = getState();
      const loadedSymbol =
        typeof summary?.data?.symbol === 'string'
          ? summary.data.symbol.trim().toUpperCase()
          : '';

      if (loadedSymbol !== normalized) {
        return false;
      }

      if (summary?.fundamentalsLoading && summary?.fundamentalsSymbol === normalized) {
        return false;
      }

      if (summary?.fundamentalsSymbol === normalized) {
        return false;
      }

      return true;
    },
  }
);

export const fetchSummaryPeerAverages = createAsyncThunk(
  'summary/fetchSummaryPeerAverages',
  async (symbol, { dispatch, rejectWithValue }) => {
    try {
      const data = await fetchStockPeerAverages(symbol);
      if (data?.status === 'pending') {
        const retryMs = Math.max(500, Number(data?.retry_after_seconds || 1) * 1000);
        setTimeout(() => {
          dispatch(fetchSummaryPeerAverages(symbol));
        }, retryMs);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (symbol, { getState }) => {
      const normalized = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';
      if (!normalized) return false;

      const { summary } = getState();
      const loadedSymbol =
        typeof summary?.data?.symbol === 'string'
          ? summary.data.symbol.trim().toUpperCase()
          : '';

      if (loadedSymbol !== normalized) {
        return false;
      }

      if (summary?.peerAvgLoading && summary?.peerAvgSymbol === normalized) {
        return false;
      }

      if (summary?.peerAvgSymbol === normalized) {
        return false;
      }

      return true;
    },
  }
);

const summarySlice = createSlice({
  name: 'summary',
  initialState: {
    data: null,
    loading: false,
    error: null,
    currentSymbol: null,
    peerLoading: false,
    peerError: null,
    peerSymbol: null,
    fundamentalsLoading: false,
    fundamentalsError: null,
    fundamentalsSymbol: null,
    peerAvgLoading: false,
    peerAvgError: null,
    peerAvgSymbol: null,
  },
  reducers: {
    clearSummary(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.peerLoading = false;
      state.peerError = null;
      state.peerSymbol = null;
      state.fundamentalsLoading = false;
      state.fundamentalsError = null;
      state.fundamentalsSymbol = null;
      state.peerAvgLoading = false;
      state.peerAvgError = null;
      state.peerAvgSymbol = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.data = null;
        state.currentSymbol =
          typeof action.meta.arg === 'string'
            ? action.meta.arg.trim().toUpperCase()
            : null;
        state.peerLoading = false;
        state.peerError = null;
        state.peerSymbol = null;
        state.fundamentalsLoading = false;
        state.fundamentalsError = null;
        state.fundamentalsSymbol = null;
        state.peerAvgLoading = false;
        state.peerAvgError = null;
        state.peerAvgSymbol = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        if (action.payload?.status === 'pending') {
          state.loading = true;
          state.data = action.payload;
          state.currentSymbol = null;
        } else {
          const existing = state.data || {};
          const extra = {};
          if (existing.peer_info) extra.peer_info = existing.peer_info;
          if (existing.trailingPE != null) extra.trailingPE = existing.trailingPE;
          if (existing.forwardPE != null) extra.forwardPE = existing.forwardPE;
          if (existing.PEG != null) extra.PEG = existing.PEG;
          if (existing.PGI != null) extra.PGI = existing.PGI;
          if (existing.dividendYield != null) extra.dividendYield = existing.dividendYield;
          if (existing.beta != null) extra.beta = existing.beta;
          if (existing.marketCap != null) extra.marketCap = existing.marketCap;
          if (existing.avg_peer_trailingPE != null) {
            extra.avg_peer_trailingPE = existing.avg_peer_trailingPE;
          }
          if (existing.avg_peer_forwardPE != null) {
            extra.avg_peer_forwardPE = existing.avg_peer_forwardPE;
          }
          if (existing.avg_peer_PEG != null) extra.avg_peer_PEG = existing.avg_peer_PEG;
          if (existing.avg_peer_PGI != null) extra.avg_peer_PGI = existing.avg_peer_PGI;
          if (existing.avg_peer_beta != null) extra.avg_peer_beta = existing.avg_peer_beta;
          state.loading = false;
          state.data = { ...action.payload, ...extra };
          state.currentSymbol = null;
        }
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // or some error message
        state.currentSymbol = null;
        state.peerLoading = false;
        state.peerError = null;
        state.peerSymbol = null;
        state.fundamentalsLoading = false;
        state.fundamentalsError = null;
        state.fundamentalsSymbol = null;
        state.peerAvgLoading = false;
        state.peerAvgError = null;
        state.peerAvgSymbol = null;
      })
      .addCase(fetchSummaryPeers.pending, (state) => {
        state.peerLoading = true;
        state.peerError = null;
      })
      .addCase(fetchSummaryPeers.fulfilled, (state, action) => {
        if (action.payload?.status === 'pending') {
          state.peerLoading = true;
          state.peerError = null;
          return;
        }
        state.peerLoading = false;
        state.peerError = null;
        state.peerSymbol =
          typeof action.meta.arg === 'string'
            ? action.meta.arg.trim().toUpperCase()
            : null;
        if (state.data) {
          state.data = { ...state.data, ...action.payload };
        }
      })
      .addCase(fetchSummaryPeers.rejected, (state, action) => {
        state.peerLoading = false;
        state.peerError = action.payload;
      })
      .addCase(fetchSummaryFundamentals.pending, (state) => {
        state.fundamentalsLoading = true;
        state.fundamentalsError = null;
      })
      .addCase(fetchSummaryFundamentals.fulfilled, (state, action) => {
        if (action.payload?.status === 'pending') {
          state.fundamentalsLoading = true;
          state.fundamentalsError = null;
          return;
        }
        state.fundamentalsLoading = false;
        state.fundamentalsError = null;
        state.fundamentalsSymbol =
          typeof action.meta.arg === 'string'
            ? action.meta.arg.trim().toUpperCase()
            : null;
        if (state.data) {
          state.data = { ...state.data, ...action.payload };
        }
      })
      .addCase(fetchSummaryFundamentals.rejected, (state, action) => {
        state.fundamentalsLoading = false;
        state.fundamentalsError = action.payload;
      })
      .addCase(fetchSummaryPeerAverages.pending, (state) => {
        state.peerAvgLoading = true;
        state.peerAvgError = null;
      })
      .addCase(fetchSummaryPeerAverages.fulfilled, (state, action) => {
        if (action.payload?.status === 'pending') {
          state.peerAvgLoading = true;
          state.peerAvgError = null;
          return;
        }
        state.peerAvgLoading = false;
        state.peerAvgError = null;
        state.peerAvgSymbol =
          typeof action.meta.arg === 'string'
            ? action.meta.arg.trim().toUpperCase()
            : null;
        if (state.data) {
          state.data = { ...state.data, ...action.payload };
        }
      })
      .addCase(fetchSummaryPeerAverages.rejected, (state, action) => {
        state.peerAvgLoading = false;
        state.peerAvgError = action.payload;
      });
  }
});

export const { clearSummary } = summarySlice.actions;
export default summarySlice.reducer;
