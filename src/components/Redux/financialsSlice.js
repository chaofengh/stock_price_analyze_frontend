// /Redux/financialsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchBalanceSheetData,
  fetchCashFlowData,
  fetchIncomeStatementData,
} from '../../API/StockService';

// Thunk for balance sheet data
export const fetchBalanceSheet = createAsyncThunk(
  'financials/fetchBalanceSheet',
  async (symbol, { rejectWithValue }) => {
    try {
      const data = await fetchBalanceSheetData(symbol);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk for cash flow data
export const fetchCashFlow = createAsyncThunk(
  'financials/fetchCashFlow',
  async (symbol, { rejectWithValue }) => {
    try {
      const data = await fetchCashFlowData(symbol);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk for income statement data
export const fetchIncomeStatement = createAsyncThunk(
  'financials/fetchIncomeStatement',
  async (symbol, { rejectWithValue }) => {
    try {
      const data = await fetchIncomeStatementData(symbol);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  balanceSheet: null,
  cashFlow: null,
  incomeStatement: null,
  loadingBalanceSheet: false,
  loadingCashFlow: false,
  loadingIncomeStatement: false,
  errorBalanceSheet: null,
  errorCashFlow: null,
  errorIncomeStatement: null,
};

const financialsSlice = createSlice({
  name: 'financials',
  initialState,
  reducers: {
    setIncomeStatement: (state, action) => {
      const { data, symbol } = action.payload || {};
      if (!data || !symbol) return;
      state.incomeStatement = { ...data, symbol };
      state.loadingIncomeStatement = false;
      state.errorIncomeStatement = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // balance sheet
      .addCase(fetchBalanceSheet.pending, (state) => {
        state.loadingBalanceSheet = true;
        state.errorBalanceSheet = null;
      })
      .addCase(fetchBalanceSheet.fulfilled, (state, action) => {
        state.loadingBalanceSheet = false;
        state.balanceSheet = { ...action.payload, symbol: action.meta.arg };
      })
      .addCase(fetchBalanceSheet.rejected, (state, action) => {
        state.loadingBalanceSheet = false;
        state.errorBalanceSheet = action.payload;
      })
      // cash flow
      .addCase(fetchCashFlow.pending, (state) => {
        state.loadingCashFlow = true;
        state.errorCashFlow = null;
      })
      .addCase(fetchCashFlow.fulfilled, (state, action) => {
        state.loadingCashFlow = false;
        state.cashFlow = { ...action.payload, symbol: action.meta.arg };
      })
      .addCase(fetchCashFlow.rejected, (state, action) => {
        state.loadingCashFlow = false;
        state.errorCashFlow = action.payload;
      })
      // income statement
      .addCase(fetchIncomeStatement.pending, (state) => {
        state.loadingIncomeStatement = true;
        state.errorIncomeStatement = null;
      })
      .addCase(fetchIncomeStatement.fulfilled, (state, action) => {
        state.loadingIncomeStatement = false;
        state.incomeStatement = { ...action.payload, symbol: action.meta.arg };
      })
      .addCase(fetchIncomeStatement.rejected, (state, action) => {
        state.loadingIncomeStatement = false;
        state.errorIncomeStatement = action.payload;
      });
  },
});

export const { setIncomeStatement } = financialsSlice.actions;
export default financialsSlice.reducer;
