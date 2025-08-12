// src/Redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import summaryReducer from "./summarySlice";
import financialsReducer from "./financialsSlice";
import newsReducer from "./newsSlice";
import authReducer from "./authSlice";
import { authApi } from "./authApi";
import logosReducer from "./logosSlice"; // ⬅️ NEW

export const store = configureStore({
  reducer: {
    summary: summaryReducer,
    financials: financialsReducer,
    news: newsReducer,
    auth: authReducer,
    logos: logosReducer, // ⬅️ NEW
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
});
