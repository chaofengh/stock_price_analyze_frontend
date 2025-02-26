// src/redux/summarySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchStockSummary } from '../../API/StockService';

// Thunk to fetch summary data
export const fetchSummary = createAsyncThunk(
  'summary/fetchSummary',
  async (symbol, { rejectWithValue }) => {
    try {
      const data = await fetchStockSummary(symbol);
      return data;
    } catch (err) {
      // If using server errors, adapt as needed:
      // return rejectWithValue(err.response.data);
      return rejectWithValue(err.message);
    }
  }
);

const summarySlice = createSlice({
  name: 'summary',
  initialState: {
    data: null,
    loading: false,
    error: null
  },
  reducers: {
    clearSummary(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;  // full summary object
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // or some error message
      });
  }
});

export const { clearSummary } = summarySlice.actions;
export default summarySlice.reducer;
