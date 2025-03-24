import { configureStore } from '@reduxjs/toolkit';
import summaryReducer from './summarySlice';
import financialsReducer from './financialsSlice';
import newsReducer from './newsSlice';


export const store = configureStore({
  reducer: {
    summary: summaryReducer,
    financials: financialsReducer,
    news: newsReducer
  }
});