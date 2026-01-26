export const CONFETTI_EXPERIMENT_FLAGS = {
  signupSuccess:
    process.env.REACT_APP_EXPERIMENT_CONFETTI_SIGNUP_SUCCESS_FLAG ||
    'exp_confetti_signup_success',
  firstWatchlistAdd:
    process.env.REACT_APP_EXPERIMENT_CONFETTI_FIRST_WATCHLIST_ADD_FLAG ||
    'exp_confetti_first_watchlist_add',
};

export function shouldEnableConfetti(flagValue, { defaultEnabled = true } = {}) {
  if (flagValue === undefined) return defaultEnabled;
  if (typeof flagValue === 'boolean') return flagValue;
  if (typeof flagValue !== 'string') return defaultEnabled;
  const normalized = flagValue.trim().toLowerCase();
  if (!normalized) return defaultEnabled;
  return !['control', 'off', 'false', '0', 'no'].includes(normalized);
}

export function getFeatureFlagVariant(posthog, flagKey) {
  return posthog?.getFeatureFlag?.(flagKey, { send_event: false });
}

export function captureFeatureFlagExposureWhenReady(posthog, flagKey, { timeoutMs = 2000 } = {}) {
  if (!posthog?.getFeatureFlag) return undefined;
  const value = posthog.getFeatureFlag(flagKey);
  if (value !== undefined) return value;
  if (typeof posthog.onFeatureFlags !== 'function') return undefined;

  let didUnsubscribe = false;
  let timeoutId = null;
  const unsubscribe = posthog.onFeatureFlags(() => {
    const nextValue = posthog.getFeatureFlag(flagKey);
    if (nextValue !== undefined || timeoutMs <= 0) {
      if (!didUnsubscribe) {
        didUnsubscribe = true;
        unsubscribe();
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    }
  });

  timeoutId = setTimeout(() => {
    if (didUnsubscribe) return;
    didUnsubscribe = true;
    unsubscribe();
  }, timeoutMs);

  return undefined;
}

