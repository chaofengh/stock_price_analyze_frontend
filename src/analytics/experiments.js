export const WATCHLIST_EXPERIMENT_FLAGS = {
  suggestionsEmptyState:
    process.env.REACT_APP_EXPERIMENT_WATCHLIST_SUGGESTIONS_EMPTY_FLAG ||
    'exp_watchlist_suggestions_empty_state',
};

export function isFlagVariantEnabled(flagValue, { defaultEnabled = true } = {}) {
  if (flagValue === undefined) return defaultEnabled;
  if (typeof flagValue === 'boolean') return flagValue;
  if (typeof flagValue !== 'string') return defaultEnabled;
  const normalized = flagValue.trim().toLowerCase();
  if (!normalized) return defaultEnabled;
  return !['control', 'off', 'false', '0', 'no'].includes(normalized);
}

export function getFeatureFlagVariantWithWait(posthog, flagKey, { timeoutMs = 2000 } = {}) {
  if (!posthog?.getFeatureFlag) return Promise.resolve(undefined);

  // First attempt: if flags already loaded, this returns immediately (and emits $feature_flag_called).
  const initial = posthog.getFeatureFlag(flagKey);
  if (initial !== undefined) return Promise.resolve(initial);
  if (typeof posthog.onFeatureFlags !== 'function' || timeoutMs <= 0) return Promise.resolve(initial);

  // Flags not ready yet: wait briefly for them, then read once (emitting $feature_flag_called).
  return new Promise((resolve) => {
    let didResolve = false;
    let timeoutId = null;

    const unsubscribe = posthog.onFeatureFlags(() => {
      const next = posthog.getFeatureFlag(flagKey);
      if (next === undefined) return;
      if (didResolve) return;
      didResolve = true;
      if (timeoutId != null) clearTimeout(timeoutId);
      unsubscribe();
      resolve(next);
    });

    timeoutId = setTimeout(() => {
      if (didResolve) return;
      didResolve = true;
      unsubscribe();
      resolve(undefined);
    }, timeoutMs);
  });
}
