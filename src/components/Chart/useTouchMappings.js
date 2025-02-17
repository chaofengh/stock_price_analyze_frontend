// useTouchMappings.js
import { useMemo } from 'react';

export function useTouchEventTypes(summary, formatDate) {
  return useMemo(() => {
    const mapping = {};
    const addEventType = (event, type) => {
      const key = formatDate(event.touch_date);
      mapping[key] = type;
    };

    if (summary?.window_5) {
      summary.window_5.lower_touch_bounces?.forEach(event =>
        addEventType(event, 'lower')
      );
      summary.window_5.upper_touch_pullbacks?.forEach(event =>
        addEventType(event, 'upper')
      );
    }
    if (summary?.window_10) {
      summary.window_10.lower_touch_bounces?.forEach(event =>
        addEventType(event, 'lower')
      );
      summary.window_10.upper_touch_pullbacks?.forEach(event =>
        addEventType(event, 'upper')
      );
    }

    return mapping;
  }, [summary, formatDate]);
}

export function useTouchTooltipMappings(summary, formatDate) {
  return useMemo(() => {
    const mapping = {};

    const addEventToMapping = (event, windowLabel, type) => {
      const key = formatDate(event.touch_date);
      let lines = [];

      if (type === 'lower') {
        const diff = event.peak_price - event.touch_price;
        lines = [
          `Window ${windowLabel}:`,
          `Event: Lower Bollinger Bounce`,
          `Touch Price: $${event.touch_price.toFixed(2)}`,
          `Peak Price: $${event.peak_price.toFixed(2)}`,
          `Bounce: $${diff.toFixed(2)} in ${event.trading_days} day${event.trading_days > 1 ? 's' : ''}`,
        ];
      } else if (type === 'upper') {
        lines = [
          `Window ${windowLabel}:`,
          `Event: Upper Bollinger Pullback`,
          `Touch Price: $${event.touch_price.toFixed(2)}`,
          `Trough Price: $${event.trough_price.toFixed(2)}`,
          `Drop: $${event.drop_dollars.toFixed(2)} in ${event.trading_days} day${event.trading_days > 1 ? 's' : ''}`,
        ];
      }

      // If we already have lines for this date, just concat them
      if (mapping[key]) {
        mapping[key] = mapping[key].concat([''], lines);
      } else {
        mapping[key] = lines;
      }
    };

    if (summary?.window_5) {
      const w5 = summary.window_5;
      w5.lower_touch_bounces?.forEach(event =>
        addEventToMapping(event, '5', 'lower')
      );
      w5.upper_touch_pullbacks?.forEach(event =>
        addEventToMapping(event, '5', 'upper')
      );
    }
    if (summary?.window_10) {
      const w10 = summary.window_10;
      w10.lower_touch_bounces?.forEach(event =>
        addEventToMapping(event, '10', 'lower')
      );
      w10.upper_touch_pullbacks?.forEach(event =>
        addEventToMapping(event, '10', 'upper')
      );
    }

    return mapping;
  }, [summary, formatDate]);
}
