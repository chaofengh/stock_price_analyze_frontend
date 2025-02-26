import { configureStore } from '@reduxjs/toolkit';
import summaryReducer from './summarySlice';

export const store = configureStore({
  reducer: {
    summary: summaryReducer
  }
});