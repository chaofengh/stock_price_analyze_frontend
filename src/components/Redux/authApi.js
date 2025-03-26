// redux/authApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setAccessToken, setRefreshToken } from './authSlice';

const BASE_URL = process.env.REACT_APP_summary_root_api || '';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Perform the initial query
  let result = await baseQuery(args, api, extraOptions);
  
  // If we get a 401 error, try to refresh the token
  if (result.error && result.error.status === 401) {
    const refreshToken = api.getState().auth.refreshToken;
    if (refreshToken) {
      // Attempt to get new tokens using the refresh token endpoint
      const refreshResult = await baseQuery(
        {
          url: '/api/refresh_token',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );
      if (refreshResult.data) {
        // Dispatch actions to update tokens in state and localStorage
        api.dispatch(setAccessToken(refreshResult.data.token));
        api.dispatch(setRefreshToken(refreshResult.data.refreshToken));
        // Retry the original query with the new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed—log out the user
        api.dispatch(logout());
      }
    } else {
      // No refresh token available—log out the user
      api.dispatch(logout());
    }
  }
  return result;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // Login endpoint
    login: builder.mutation({
      query: (body) => ({
        url: '/login',
        method: 'POST',
        body,
      }),
    }),
    // Register endpoint
    register: builder.mutation({
      query: (body) => ({
        url: '/register',
        method: 'POST',
        body,
      }),
    }),
    // Refresh token endpoint (optional, since it's used in baseQueryWithReauth)
    refreshToken: builder.mutation({
      query: (body) => ({
        url: '/refresh_token',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
} = authApi;
