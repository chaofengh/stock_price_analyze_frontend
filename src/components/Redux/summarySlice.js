// src/redux/summarySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchStockSummary,
  fetchStockPeers,
  fetchStockFundamentals,
  fetchStockPeerAverages,
} from '../../API/StockService';

const normalizeSymbol = (symbol) =>
  typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';

const getSymbolArg = (arg) =>
  typeof arg === 'string' ? arg : arg?.symbol;

// Thunk to fetch summary data
export const fetchSummary = createAsyncThunk(
  'summary/fetchSummary',
  async (arg, { rejectWithValue }) => {
    const normalizedSymbol = normalizeSymbol(getSymbolArg(arg));
    if (!normalizedSymbol) {
      return rejectWithValue('Missing symbol');
    }
    try {
      return await fetchStockSummary(normalizedSymbol);
    } catch (err) {
      const message = err?.message || 'Server error';
      return rejectWithValue(message);
    }
  },
  {
    condition: (arg, { getState }) => {
      const normalized = normalizeSymbol(getSymbolArg(arg));
      if (!normalized) return false;

      const { summary } = getState();
      const currentSymbol = normalizeSymbol(summary?.currentSymbol);
      const loadedSymbol = normalizeSymbol(summary?.data?.symbol);

      if (summary?.loading && currentSymbol === normalized) {
        return false;
      }

      if (loadedSymbol === normalized && !summary?.error) {
        return false;
      }

      return true;
    },
  }
);

export const fetchSummaryPeers = createAsyncThunk(
  'summary/fetchSummaryPeers',
  async (symbol, { rejectWithValue }) => {
    try {
      return await fetchStockPeers(symbol);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (symbol, { getState }) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return false;

      const { summary } = getState();
      const loadedSymbol = normalizeSymbol(summary?.data?.symbol);
      const currentSymbol = normalizeSymbol(summary?.currentSymbol);
      const activeSymbol = loadedSymbol || currentSymbol;

      if (activeSymbol !== normalized) {
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
      dispatch(fetchSummaryPeerAverages(symbol));
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (symbol, { getState }) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return false;

      const { summary } = getState();
      const loadedSymbol = normalizeSymbol(summary?.data?.symbol);
      const currentSymbol = normalizeSymbol(summary?.currentSymbol);
      const activeSymbol = loadedSymbol || currentSymbol;

      if (activeSymbol !== normalized) {
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
  async (symbol, { rejectWithValue }) => {
    try {
      return await fetchStockPeerAverages(symbol);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (symbol, { getState }) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return false;

      const { summary } = getState();
      const loadedSymbol = normalizeSymbol(summary?.data?.symbol);
      const currentSymbol = normalizeSymbol(summary?.currentSymbol);
      const activeSymbol = loadedSymbol || currentSymbol;

      if (activeSymbol !== normalized) {
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
        const normalized = normalizeSymbol(getSymbolArg(action.meta.arg));
        const existingSymbol = normalizeSymbol(state.data?.symbol);
        const isSameSymbol = normalized && existingSymbol && normalized === existingSymbol;
        state.loading = true;
        state.error = null;
        state.currentSymbol = normalized || null;
        if (!isSameSymbol) {
          state.data = normalized ? { symbol: normalized } : null;
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
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        const incomingArgSymbol = normalizeSymbol(getSymbolArg(action.meta.arg));
        const incomingSymbol = normalizeSymbol(action.payload?.symbol || incomingArgSymbol);
        const existingSymbol = normalizeSymbol(state.data?.symbol);
        const sameSymbol = incomingSymbol && existingSymbol && incomingSymbol === existingSymbol;
        const existing = sameSymbol ? state.data || {} : {};
        const extra = {};
        if (existing.peer_info) extra.peer_info = existing.peer_info;
        if (existing.trailingPE != null) extra.trailingPE = existing.trailingPE;
        if (existing.forwardPE != null) extra.forwardPE = existing.forwardPE;
        if (existing.PEG != null) extra.PEG = existing.PEG;
        if (existing.PGI != null) extra.PGI = existing.PGI;
        if (existing.dividendYield != null) extra.dividendYield = existing.dividendYield;
        if (existing.beta != null) extra.beta = existing.beta;
        if (existing.marketCap != null) extra.marketCap = existing.marketCap;
        if (existing.revenuePerEmployee != null) extra.revenuePerEmployee = existing.revenuePerEmployee;
        if (existing.grossProfitPerEmployee != null) {
          extra.grossProfitPerEmployee = existing.grossProfitPerEmployee;
        }
        if (existing.operatingIncomePerEmployee != null) {
          extra.operatingIncomePerEmployee = existing.operatingIncomePerEmployee;
        }
        if (existing.sgaPerEmployee != null) extra.sgaPerEmployee = existing.sgaPerEmployee;
        if (existing.salesPerSalesperson != null) {
          extra.salesPerSalesperson = existing.salesPerSalesperson;
        }
        if (existing.roic != null) extra.roic = existing.roic;
        if (existing.roa != null) extra.roa = existing.roa;
        if (existing.assetTurnover != null) extra.assetTurnover = existing.assetTurnover;
        if (existing.capexIntensity != null) extra.capexIntensity = existing.capexIntensity;
        if (existing.freeCashFlowMargin != null) {
          extra.freeCashFlowMargin = existing.freeCashFlowMargin;
        }
        if (existing.grossMargin != null) extra.grossMargin = existing.grossMargin;
        if (existing.operatingMargin != null) extra.operatingMargin = existing.operatingMargin;
        if (existing.sgaPercentRevenue != null) {
          extra.sgaPercentRevenue = existing.sgaPercentRevenue;
        }
        if (existing.rdPercentRevenue != null) extra.rdPercentRevenue = existing.rdPercentRevenue;
        if (existing.metricTrends != null) extra.metricTrends = existing.metricTrends;
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
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        const incomingSymbol = normalizeSymbol(getSymbolArg(action.meta?.arg));
        const dataSymbol = normalizeSymbol(state.data?.symbol);
        const hasChartData = Array.isArray(state.data?.chart_data) && state.data.chart_data.length > 0;
        state.loading = false;
        state.error = action.payload; // or some error message
        state.currentSymbol = null;
        if (!hasChartData || dataSymbol !== incomingSymbol) {
          state.data = incomingSymbol ? { symbol: incomingSymbol } : null;
        }
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
        state.peerLoading = false;
        state.peerError = null;
        state.peerSymbol = normalizeSymbol(action.meta.arg) || null;
        const dataSymbol = normalizeSymbol(state.data?.symbol);
        if (state.data && dataSymbol === state.peerSymbol) {
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
        state.fundamentalsLoading = false;
        state.fundamentalsError = null;
        state.fundamentalsSymbol = normalizeSymbol(action.meta.arg) || null;
        const dataSymbol = normalizeSymbol(state.data?.symbol);
        if (state.data && dataSymbol === state.fundamentalsSymbol) {
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
        state.peerAvgLoading = false;
        state.peerAvgError = null;
        state.peerAvgSymbol = normalizeSymbol(action.meta.arg) || null;
        const dataSymbol = normalizeSymbol(state.data?.symbol);
        if (state.data && dataSymbol === state.peerAvgSymbol) {
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
