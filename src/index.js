import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { store } from './components/Redux/store';
import { Provider } from 'react-redux';
import { PostHogProvider } from 'posthog-js/react';
import { loadFromStorage } from './components/Redux/authSlice';

store.dispatch(loadFromStorage());

const clientEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const posthogApiKey =
  clientEnv.REACT_APP_POSTHOG_KEY ||
  clientEnv.REACT_APP_POSTHOG_API_KEY ||
  process.env.REACT_APP_POSTHOG_KEY ||
  process.env.REACT_APP_POSTHOG_API_KEY;
const posthogHost =
  clientEnv.REACT_APP_POSTHOG_HOST || process.env.REACT_APP_POSTHOG_HOST;
const isNonProd = process.env.NODE_ENV !== 'production';
// PostHog drops events when `navigator.webdriver === true` unless this is enabled.
// Playwright sets `navigator.webdriver`, so simulations/tests won't show up in PostHog
// without opting out of the user-agent/WebDriver filter in non-prod.
const optOutUserAgentFilter = isNonProd;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={posthogApiKey}
      options={{
        api_host: posthogHost,
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: process.env.NODE_ENV === 'development',
        opt_out_useragent_filter: optOutUserAgentFilter,
        // Expose a stable handle for Playwright simulations/debugging.
        // This does not affect normal tracking behavior.
        loaded: (ph) => {
          if (!isNonProd) return;
          try {
            window.__posthog = ph;
            window.__posthog_loaded = true;
          } catch {
            // ignore
          }
        },
      }}
    >
      <Provider store={store}>
        <App />
      </Provider>
    </PostHogProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
