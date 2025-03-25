// redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { authApi } from './authApi';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    loadFromStorage(state) {
      const storedAccess = localStorage.getItem('accessToken');
      const storedRefresh = localStorage.getItem('refreshToken');
      if (storedAccess) state.accessToken = storedAccess;
      if (storedRefresh) state.refreshToken = storedRefresh;
    },
    setAccessToken(state, action) {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    setRefreshToken(state, action) {
      state.refreshToken = action.payload;
      localStorage.setItem('refreshToken', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        const { user, token, refreshToken } = action.payload;
        state.user = user || null;
        state.accessToken = token || null;
        state.refreshToken = refreshToken || null;
        if (token) localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      })
      .addMatcher(authApi.endpoints.register.matchFulfilled, (state, action) => {
        // You can auto-login or handle registration success here if needed.
      })
      .addMatcher(authApi.endpoints.refreshToken.matchFulfilled, (state, action) => {
        const { token, refreshToken } = action.payload;
        if (token) {
          state.accessToken = token;
          localStorage.setItem('accessToken', token);
        }
        if (refreshToken) {
          state.refreshToken = refreshToken;
          localStorage.setItem('refreshToken', refreshToken);
        }
      });
  },
});

export const { logout, loadFromStorage, setAccessToken, setRefreshToken } = authSlice.actions;
export default authSlice.reducer;
