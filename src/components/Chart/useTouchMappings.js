// useTouchMappings.js
import { useMemo } from "react";

export function useTouchEventTypes(summary, formatDate) {
  return useMemo(() => {
    const mapping = {};
    const addEventType = (event, type) => {
      const key = formatDate(event.touch_date);
      mapping[key] = type;
    };

    if (summary?.window_5) {
      summary.window_5.lower_touch_bounces?.forEach(e => addEventType(e, "lower"));
      summary.window_5.upper_touch_pullbacks?.forEach(e => addEventType(e, "upper"));
    }
    if (summary?.window_10) {
      summary.window_10.lower_touch_bounces?.forEach(e => addEventType(e, "lower"));
      summary.window_10.upper_touch_pullbacks?.forEach(e => addEventType(e, "upper"));
    }
    return mapping;
  }, [summary, formatDate]);
}

/**
 * Returns { [ISOdate]: Array<{
 *   windowLabel: "5" | "10",
 *   kind: "bounce" | "pullback",
 *   direction: "up" | "down",
 *   startPrice: number, // touch
 *   endPrice: number,   // peak or trough
 *   delta: number,      // signed dollars
 *   days: number
 * }>}
 */
export function useTouchTooltipMappings(summary, formatDate) {
  return useMemo(() => {
    const mapping = {};
    const add = (dateKey, item) => {
      (mapping[dateKey] ||= []).push(item);
    };

    const pushLower = (ev, win) => {
      const key = formatDate(ev.touch_date);
      add(key, {
        windowLabel: win,
        kind: "bounce",
        direction: "up",
        startPrice: ev.touch_price,
        endPrice: ev.peak_price,
        delta: (ev.peak_price ?? 0) - (ev.touch_price ?? 0),
        days: ev.trading_days,
      });
    };

    const pushUpper = (ev, win) => {
      const key = formatDate(ev.touch_date);
      const delta = ev.drop_dollars ?? ((ev.trough_price ?? 0) - (ev.touch_price ?? 0));
      add(key, {
        windowLabel: win,
        kind: "pullback",
        direction: "down",
        startPrice: ev.touch_price,
        endPrice: ev.trough_price,
        delta,
        days: ev.trading_days,
      });
    };

    if (summary?.window_5) {
      const w5 = summary.window_5;
      w5.lower_touch_bounces?.forEach(e => pushLower(e, "5"));
      w5.upper_touch_pullbacks?.forEach(e => pushUpper(e, "5"));
    }
    if (summary?.window_10) {
      const w10 = summary.window_10;
      w10.lower_touch_bounces?.forEach(e => pushLower(e, "10"));
      w10.upper_touch_pullbacks?.forEach(e => pushUpper(e, "10"));
    }

    return mapping;
  }, [summary, formatDate]);
}
