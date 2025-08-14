// useChartData.js
import { useMemo } from 'react';

/**
 * Build chart data and color touch points by P&L.
 *
 * @param {object} summary
 * @param {object} eventTypeMappingTouch   // optional fallback: { 'YYYY-MM-DD': 'lower'|'upper' }
 * @param {object} pnlStatusByDate         // preferred: { 'YYYY-MM-DD': { status:'profit'|'loss'|'mixed' } }
 */
export function useChartData(summary, eventTypeMappingTouch = {}, pnlStatusByDate = {}) {
  return useMemo(() => {
    const rows = summary?.chart_data || [];
    if (!rows.length) return { labels: [], datasets: [] };

    const labels = rows.map(pt => pt.date);
    const data = rows.map(pt => pt.close ?? null);

    // Colors
    const GREEN = '#2ecc71';  // profit
    const RED   = '#e74c3c';  // loss
    const AMBER = '#f59e0b';  // mixed / fallback
    const DEFAULT_POINT = 'rgba(25,118,210,0.9)'; // small dots along the line
    const LINE_COLOR = '#1976d2';

    const TOUCH_R = 5;          // bigger for touches
    const TOUCH_HOVER_R = 7;
    const NORMAL_R = 1.5;       // tiny dot otherwise
    const NORMAL_HOVER_R = 3;

    const pointRadius = [];
    const pointHoverRadius = [];
    const pointBackgroundColor = [];
    const pointBorderColor = [];
    const pointBorderWidth = [];

    labels.forEach((date, idx) => {
      const pt = rows[idx];
      const pnl = pnlStatusByDate?.[date]?.status; // 'profit'|'loss'|'mixed' or undefined

      if (pnl) {
        // Color strictly by P&L (preferred)
        const color = pnl === 'profit' ? GREEN : pnl === 'loss' ? RED : AMBER;
        pointRadius.push(TOUCH_R);
        pointHoverRadius.push(TOUCH_HOVER_R);
        pointBackgroundColor.push(color);
        pointBorderColor.push('#0b0f14');  // subtle ring for contrast on dark canvas
        pointBorderWidth.push(1.5);
      } else if (pt.isTouch) {
        // Fallback: if we have no P&L status yet, use band touch type
        const t = eventTypeMappingTouch?.[date];
        const color = t === 'lower' ? GREEN : t === 'upper' ? RED : AMBER;
        pointRadius.push(TOUCH_R);
        pointHoverRadius.push(TOUCH_HOVER_R);
        pointBackgroundColor.push(color);
        pointBorderColor.push('#0b0f14');
        pointBorderWidth.push(1.5);
      } else {
        // Non-touch day
        pointRadius.push(NORMAL_R);
        pointHoverRadius.push(NORMAL_HOVER_R);
        pointBackgroundColor.push(DEFAULT_POINT);
        pointBorderColor.push('transparent');
        pointBorderWidth.push(0);
      }
    });

    return {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Close',
          data,
          borderColor: LINE_COLOR,
          borderWidth: 2,
          tension: 0.2,
          fill: false,
          pointRadius,
          pointHoverRadius,
          pointHitRadius: 8,
          pointBackgroundColor,
          pointBorderColor,
          pointBorderWidth,
          order: 2,
        },
      ],
    };
  }, [summary, eventTypeMappingTouch, pnlStatusByDate]);
}

export default useChartData;
