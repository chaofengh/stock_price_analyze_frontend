import { configureStore } from '@reduxjs/toolkit';
import summaryReducer from './summarySlice';
import financialsReducer from './financialsSlice';


export const store = configureStore({
  reducer: {
    summary: summaryReducer,
    financials: financialsReducer
  }
});