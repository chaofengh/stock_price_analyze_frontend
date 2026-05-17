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
  openEntrySignals: [],
  openEntrySignalStories: [],
  entryDecisionPreload: null,
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

const buildEntrySignalId = (signal) => {
  const symbol = normalizeSymbol(signal?.symbol || signal?.ticker);
  const signalDate = typeof signal?.signal_date === 'string' ? signal.signal_date : '';
  const horizon = signal?.horizon_days != null ? String(signal.horizon_days) : '';
  return ['entry-signal', symbol, signalDate, horizon].filter(Boolean).join('|');
};

const preloadNeedsFollowUp = (preload) => {
  if (!preload || typeof preload !== 'object') return false;
  const status = preload.status;
  if (status === 'started' || status === 'running') return true;
  const queuedCount = Number(preload.queued_count);
  return Number.isFinite(queuedCount) && queuedCount > 0;
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
  const [openEntrySignals, setOpenEntrySignals] = useState([]);
  const [openEntrySignalStories, setOpenEntrySignalStories] = useState([]);
  const [entryDecisionPreload, setEntryDecisionPreload] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const alertReceiptRef = useRef(new Map());
  const lastNotificationRef = useRef({ timestamp: null, alertCount: null });
  const preloadFollowUpTimerRef = useRef(null);

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
        const preload = data?.entry_decision_preload ?? null;
        const rawAlerts = Array.isArray(data?.alerts) ? data.alerts : [];
        const rawOpenEntrySignals = Array.isArray(data?.open_entry_signals)
          ? data.open_entry_signals
          : [];
        const rawOpenEntrySignalStories = Array.isArray(data?.open_entry_signal_stories)
          ? data.open_entry_signal_stories
          : [];
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
        const enrichedOpenEntrySignals = rawOpenEntrySignals.map((signal, index) => {
          const baseId = buildEntrySignalId(signal);
          return {
            ...signal,
            _signal_id: baseId || `entry-signal:${index}`,
            _received_at: now,
            _timestamp: payloadTimestamp,
          };
        });
        alertReceiptRef.current = new Map(
          enrichedAlerts.map((alert) => [alert._alert_id, { receivedAt: alert._received_at }])
        );
        setAlerts(enrichedAlerts);
        setOpenEntrySignals(enrichedOpenEntrySignals);
        setOpenEntrySignalStories(rawOpenEntrySignalStories);
        setEntryDecisionPreload(preload);
        setTimestamp(payloadTimestamp);
        setLastFetchedAt(Date.now());
        const alertCount = enrichedAlerts.length;
        const openSignalCount = enrichedOpenEntrySignals.length;
        const lastNotification = lastNotificationRef.current;
        const shouldNotify =
          alertCount + openSignalCount > 0 &&
          (lastNotification.timestamp !== payloadTimestamp ||
            lastNotification.alertCount !== alertCount ||
            lastNotification.openSignalCount !== openSignalCount);
        if (shouldNotify) {
          posthog?.capture('notification_received', {
            alert_count: alertCount,
            open_entry_signal_count: openSignalCount,
            timestamp: payloadTimestamp,
          });
        }
        lastNotificationRef.current = { timestamp: payloadTimestamp, alertCount, openSignalCount };

        if (preloadNeedsFollowUp(preload) && !signal?.aborted) {
          if (preloadFollowUpTimerRef.current) {
            clearTimeout(preloadFollowUpTimerRef.current);
          }
          preloadFollowUpTimerRef.current = setTimeout(() => {
            preloadFollowUpTimerRef.current = null;
            fetchLatest();
          }, 8000);
        }
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
      setOpenEntrySignals([]);
      setOpenEntrySignalStories([]);
      setEntryDecisionPreload(null);
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
      if (preloadFollowUpTimerRef.current) {
        clearTimeout(preloadFollowUpTimerRef.current);
        preloadFollowUpTimerRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(intervalId);
    };
  }, [accessToken, fetchLatest, pollMs]);

  /**
   * Clear alerts (e.g., "Mark as read")
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setOpenEntrySignals([]);
    setOpenEntrySignalStories([]);
    setEntryDecisionPreload(null);
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
        openEntrySignals,
        openEntrySignalStories,
        entryDecisionPreload,
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
