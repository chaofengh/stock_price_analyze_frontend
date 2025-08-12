// src/Redux/logosSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCompanyLogo } from '../../API/FetchCompanyLogo'; // adjust path if needed

// Cache logos and avoid re-fetching for a while (7 days by default)
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export const fetchLogo = createAsyncThunk(
  "logos/fetchLogo",
  async (symbol, { rejectWithValue }) => {
    try {
      const url = await fetchCompanyLogo(symbol);
      return { symbol, url, fetchedAt: Date.now() };
    } catch (err) {
      return rejectWithValue({ symbol, message: err?.message || "Logo fetch failed" });
    }
  }
);

/**
 * Thunk helper: only fetch if missing/stale/not already loading.
 * Usage: dispatch(ensureLogoForSymbol(symbol))
 */
export const ensureLogoForSymbol =
  (symbol, { ttlMs = DEFAULT_TTL_MS } = {}) =>
  (dispatch, getState) => {
    if (!symbol) return;

    const state = getState().logos;
    const entry = state.entities[symbol];
    const status = state.statusBySymbol[symbol] || "idle";
    const now = Date.now();
    const fresh = entry && now - entry.fetchedAt < ttlMs;

    if (!fresh && status !== "loading") {
      dispatch(fetchLogo(symbol));
    }
  };

const logosSlice = createSlice({
  name: "logos",
  initialState: {
    entities: /** @type {Record<string, {url: string|null, fetchedAt: number}>} */ ({}),
    statusBySymbol: /** @type {Record<string, "idle"|"loading"|"succeeded"|"failed">} */ ({}),
    errorBySymbol: /** @type {Record<string, string|undefined>} */ ({}),
  },
  reducers: {
    // Optional manual invalidation if you ever need it
    invalidateLogo(state, action) {
      const symbol = action.payload;
      delete state.entities[symbol];
      delete state.statusBySymbol[symbol];
      delete state.errorBySymbol[symbol];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogo.pending, (state, action) => {
        const symbol = action.meta.arg;
        state.statusBySymbol[symbol] = "loading";
        state.errorBySymbol[symbol] = undefined;
      })
      .addCase(fetchLogo.fulfilled, (state, action) => {
        const { symbol, url, fetchedAt } = action.payload;
        state.entities[symbol] = { url: url ?? null, fetchedAt };
        state.statusBySymbol[symbol] = "succeeded";
      })
      .addCase(fetchLogo.rejected, (state, action) => {
        const symbol = action.payload?.symbol ?? action.meta.arg;
        state.statusBySymbol[symbol] = "failed";
        state.errorBySymbol[symbol] =
          action.payload?.message || action.error?.message || "Unknown error";
        // Store a null url so we don't hammer the API every render; will retry after TTL via ensureLogoForSymbol
        state.entities[symbol] = {
          url: null,
          fetchedAt: Date.now(),
        };
      });
  },
});

export const { invalidateLogo } = logosSlice.actions;

// Selectors
const selectLogosState = (state) => state.logos;
export const selectLogoEntryBySymbol = (state, symbol) =>
  selectLogosState(state).entities[symbol];
export const selectLogoUrlBySymbol = (state, symbol) =>
  (selectLogoEntryBySymbol(state, symbol)?.url) ?? null;
export const selectLogoStatusBySymbol = (state, symbol) =>
  selectLogosState(state).statusBySymbol[symbol] || "idle";
export const selectLogoErrorBySymbol = (state, symbol) =>
  selectLogosState(state).errorBySymbol[symbol];

export default logosSlice.reducer;
