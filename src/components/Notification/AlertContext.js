// AlertsProvider.js
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useSelector } from 'react-redux';

/**
 * Context shape
 */
export const AlertsContext = createContext({
  alerts: [],
  timestamp: null,       // backend's content timestamp (e.g., "2025-08-12T...Z")
  lastFetchedAt: null,   // Date.now() of last successful fetch
  loading: false,
  error: null,
  refreshAlerts: () => {},
  clearAlerts: () => {},
});

/**
 * Provider
 * @param {number} pollMs - how often to auto-refresh while tab is open (default: 30 minutes)
 *
 * NOTE: Set REACT_APP_summary_root_api to your backend base that already includes "/api",
 * e.g., "http://localhost:5000/api" or "https://yourdomain.com/api".
 */
export const AlertsProvider = ({ children, pollMs = 30 * 60 * 1000 }) => {
  const [alerts, setAlerts] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stock_summary_api_key = process.env.REACT_APP_summary_root_api || '';

  // User from Redux (adjust selector to your store structure if needed)
  const user = useSelector((state) => state?.auth?.user);
  const userId = user?.id ?? null;

  /**
   * Build the GET /api/alerts/latest URL, trimming trailing slashes on base.
   * If your base env var does NOT include "/api", add it here before "/alerts/latest".
   */
  const buildEndpoint = useCallback(() => {
    const base = stock_summary_api_key.replace(/\/+$/, '');
    const path = '/alerts/latest';
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return `${base}${path}${query}`;
  }, [stock_summary_api_key, userId]);

  /**
   * Fetch latest alerts once. Safe to call repeatedly.
   */
  const fetchLatest = useCallback(
    async (signal) => {
      const url = buildEndpoint();
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
        setTimestamp(data?.timestamp ?? null);
        setLastFetchedAt(Date.now());
      } catch (err) {
        // Ignore aborts; capture real errors
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Failed to fetch alerts');
        }
      } finally {
        setLoading(false);
      }
    },
    [buildEndpoint]
  );

  /**
   * Initial fetch, refetch on visibility gain, and polling while tab is open.
   */
  useEffect(() => {
    const controller = new AbortController();
    fetchLatest(controller.signal);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        fetchLatest(); // refresh when tab gains focus
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Poll at a safe cadence (backend updates when the cached date changes)
    const intervalId = setInterval(() => {
      fetchLatest();
    }, pollMs);

    return () => {
      controller.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(intervalId);
    };
  }, [fetchLatest, pollMs]);

  /**
   * Clear alerts (e.g., "Mark as read")
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  /**
   * Manual refresh for UI buttons, etc.
   */
  const refreshAlerts = useCallback(() => {
    fetchLatest();
  }, [fetchLatest]);

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        timestamp,
        lastFetchedAt,
        loading,
        error,
        refreshAlerts,
        clearAlerts,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};
