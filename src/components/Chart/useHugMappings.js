// useHugMappings.js
import { useMemo } from 'react';

export function useHugEventTypes(summary, formatDate) {
  return useMemo(() => {
    const mapping = {};
    const addHugEvent = (event, type) => {
      const key = formatDate(event.hug_end_date);
      mapping[key] = type;
    };

    if (summary?.window_5) {
      summary.window_5.lower_hug_bounces?.forEach(event =>
        addHugEvent(event, 'lower_hug')
      );
      summary.window_5.upper_hug_pullbacks?.forEach(event =>
        addHugEvent(event, 'upper_hug')
      );
    }
    if (summary?.window_10) {
      summary.window_10.lower_hug_bounces?.forEach(event =>
        addHugEvent(event, 'lower_hug')
      );
      summary.window_10.upper_hug_pullbacks?.forEach(event =>
        addHugEvent(event, 'upper_hug')
      );
    }

    return mapping;
  }, [summary, formatDate]);
}

export function useHugTooltipMappings(summary, formatDate) {
  return useMemo(() => {
    const mapping = {};

    const addHugEventTooltip = (event, windowLabel, type) => {
      const key = formatDate(event.hug_end_date);
      let lines = [];

      if (type === 'lower_hug') {
        lines = [
          `Window ${windowLabel}:`,
          `Event: Lower Hug Bounce`,
          `Hug Start: $${event.hug_start_price.toFixed(2)} on ${formatDate(event.hug_start_date)}`,
          `Hug End: $${event.hug_end_price.toFixed(2)} on ${formatDate(event.hug_end_date)}`,
          `Bounce: $${event.bounce_dollars.toFixed(2)} in ${event.trading_days} day${event.trading_days > 1 ? 's' : ''}`,
          `Peak: $${event.peak_price.toFixed(2)} on ${formatDate(event.peak_date)}`,
        ];
      } else if (type === 'upper_hug') {
        lines = [
          `Window ${windowLabel}:`,
          `Event: Upper Hug Pullback`,
          `Hug Start: $${event.hug_start_price.toFixed(2)} on ${formatDate(event.hug_start_date)}`,
          `Hug End: $${event.hug_end_price.toFixed(2)} on ${formatDate(event.hug_end_date)}`,
          `Drop: $${event.drop_dollars.toFixed(2)} in ${event.trading_days} day${event.trading_days > 1 ? 's' : ''}`,
          `Trough: $${event.trough_price.toFixed(2)} on ${formatDate(event.trough_date)}`,
        ];
      }

      if (mapping[key]) {
        mapping[key] = mapping[key].concat([''], lines);
      } else {
        mapping[key] = lines;
      }
    };

    if (summary?.window_5) {
      const w5 = summary.window_5;
      w5.lower_hug_bounces?.forEach(event =>
        addHugEventTooltip(event, '5', 'lower_hug')
      );
      w5.upper_hug_pullbacks?.forEach(event =>
        addHugEventTooltip(event, '5', 'upper_hug')
      );
    }
    if (summary?.window_10) {
      const w10 = summary.window_10;
      w10.lower_hug_bounces?.forEach(event =>
        addHugEventTooltip(event, '10', 'lower_hug')
      );
      w10.upper_hug_pullbacks?.forEach(event =>
        addHugEventTooltip(event, '10', 'upper_hug')
      );
    }

    return mapping;
  }, [summary, formatDate]);
}
