// /Redux/financialsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchBalanceSheetData, fetchCashFlowData } from '../../API/StockService';

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

const initialState = {
  balanceSheet: null,
  cashFlow: null,
  loadingBalanceSheet: false,
  loadingCashFlow: false,
  errorBalanceSheet: null,
  errorCashFlow: null,
};

const financialsSlice = createSlice({
  name: 'financials',
  initialState,
  reducers: {
    // If you need any synchronous reducers, define them here.
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
        state.balanceSheet = action.payload;
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
        state.cashFlow = action.payload;
      })
      .addCase(fetchCashFlow.rejected, (state, action) => {
        state.loadingCashFlow = false;
        state.errorCashFlow = action.payload;
      });
  },
});

export default financialsSlice.reducer;
