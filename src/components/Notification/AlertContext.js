// AlertsProvider.js
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePostHog } from 'posthog-js/react';
import { logout } from '../Redux/authSlice';

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

const normalizeSymbol = (value) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

const buildAlertId = (alert, timestamp) => {
  const symbol = normalizeSymbol(alert?.symbol || alert?.ticker);
  const side = typeof alert?.touched_side === 'string' ? alert.touched_side : '';
  const ts = typeof timestamp === 'string' ? timestamp : '';
  const parts = [];
  if (ts) parts.push(ts);
  if (symbol) parts.push(symbol);
  if (side) parts.push(side);
  return parts.join('|');
};

/**
 * Provider
 * @param {number} pollMs - how often to auto-refresh while tab is open (default: 30 minutes)
 *
 * NOTE: Set REACT_APP_summary_root_api to your backend base that already includes "/api",
 * e.g., "http://localhost:5000/api" or "https://yourdomain.com/api".
 */
export const AlertsProvider = ({ children, pollMs = 30 * 60 * 1000 }) => {
  const dispatch = useDispatch();
  const posthog = usePostHog();
  const [alerts, setAlerts] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const alertReceiptRef = useRef(new Map());
  const lastNotificationRef = useRef({ timestamp: null, alertCount: null });

  const stock_summary_api_key = process.env.REACT_APP_summary_root_api || '';

  // User from Redux (adjust selector to your store structure if needed)
  const accessToken = useSelector((state) => state?.auth?.accessToken);

  /**
   * Build the GET /api/alerts/latest URL, trimming trailing slashes on base.
   * If your base env var does NOT include "/api", add it here before "/alerts/latest".
   */
  const buildEndpoint = useCallback(() => {
    const base = stock_summary_api_key.replace(/\/+$/, '');
    const path = '/alerts/latest';
    return `${base}${path}`;
  }, [stock_summary_api_key]);

  /**
   * Fetch latest alerts once. Safe to call repeatedly.
   */
  const fetchLatest = useCallback(
    async (signal) => {
      const url = buildEndpoint();
      setLoading(true);
      setError(null);
      try {
        const headers = { Accept: 'application/json' };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

        const res = await fetch(url, {
          method: 'GET',
          headers,
          signal,
        });
        if (res.status === 401) {
          dispatch(logout());
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        const payloadTimestamp = data?.timestamp ?? null;
        const rawAlerts = Array.isArray(data?.alerts) ? data.alerts : [];
        const now = Date.now();
        const enrichedAlerts = rawAlerts.map((alert, index) => {
          const baseId = buildAlertId(alert, payloadTimestamp);
          const alertId = baseId || `alert:${index}`;
          const existing = alertReceiptRef.current.get(alertId);
          const receivedAt = existing?.receivedAt ?? now;
          return {
            ...alert,
            _alert_id: alertId,
            _received_at: receivedAt,
            _timestamp: payloadTimestamp,
          };
        });
        alertReceiptRef.current = new Map(
          enrichedAlerts.map((alert) => [alert._alert_id, { receivedAt: alert._received_at }])
        );
        setAlerts(enrichedAlerts);
        setTimestamp(payloadTimestamp);
        setLastFetchedAt(Date.now());
        const alertCount = enrichedAlerts.length;
        const lastNotification = lastNotificationRef.current;
        const shouldNotify =
          alertCount > 0 &&
          (lastNotification.timestamp !== payloadTimestamp ||
            lastNotification.alertCount !== alertCount);
        if (shouldNotify) {
          posthog?.capture('notification_received', {
            alert_count: alertCount,
            timestamp: payloadTimestamp,
          });
        }
        lastNotificationRef.current = { timestamp: payloadTimestamp, alertCount };
      } catch (err) {
        // Ignore aborts; capture real errors
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Failed to fetch alerts');
        }
      } finally {
        setLoading(false);
      }
    },
    [accessToken, buildEndpoint, dispatch, posthog]
  );

  /**
   * Initial fetch, refetch on visibility gain, and polling while tab is open.
   */
  useEffect(() => {
    const controller = new AbortController();
    if (!accessToken) {
      controller.abort();
      setAlerts([]);
      setTimestamp(null);
      setLastFetchedAt(null);
      setLoading(false);
      setError(null);
      return () => {};
    }

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
  }, [accessToken, fetchLatest, pollMs]);

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
