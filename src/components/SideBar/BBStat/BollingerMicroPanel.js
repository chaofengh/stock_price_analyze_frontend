import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import TimelineRounded from '@mui/icons-material/TimelineRounded';
import StatRowVisual from './StatRowVisual';

/* — helpers — */
const fmt = (num, d = 2) =>
  num === null || num === undefined || isNaN(num)
    ? { f: '-', t: null }
    : { f: Number(num).toFixed(d), t: num > 0 ? 'up' : num < 0 ? 'down' : null };

const parseTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getRangeStartTimestamp = (latestTimestamp, range) => {
  if (latestTimestamp == null) return null;
  if (range === 'YTD') {
    const latest = new Date(latestTimestamp);
    return new Date(latest.getFullYear(), 0, 1).getTime();
  }
  const start = new Date(latestTimestamp);
  if (range === '1M') {
    start.setMonth(start.getMonth() - 1);
  } else if (range === '3M') {
    start.setMonth(start.getMonth() - 3);
  } else if (range === '1Y') {
    start.setFullYear(start.getFullYear() - 1);
  }
  return start.getTime();
};

const filterByRange = (items, rangeStartTimestamp) => {
  if (!Array.isArray(items)) return [];
  if (rangeStartTimestamp == null) return items;
  return items.filter((item) => {
    const ts = parseTimestamp(item?.touch_date || item?.hug_start_date || item?.date);
    return ts == null ? true : ts >= rangeStartTimestamp;
  });
};

const average = (items, key) => {
  if (!Array.isArray(items) || !items.length) return null;
  const values = items
    .map((item) => item?.[key])
    .filter((value) => value != null && !isNaN(value));
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const computeTouchAggregates = (results = {}) => {
  const upper = results.upper_touch_pullbacks || [];
  const lower = results.lower_touch_bounces || [];
  const upperCount = upper.length;
  const lowerCount = lower.length;

  return {
    avg_upper_touch_drop: average(upper, 'drop_dollars'),
    avg_upper_touch_in_days: average(upper, 'trading_days'),
    upper_touch_count: upperCount,
    upper_touch_accuracy: upperCount
      ? upper.filter((item) => item.drop_dollars < 0).length / upperCount
      : null,
    avg_lower_touch_bounce: average(lower, 'bounce_dollars'),
    avg_lower_touch_bounce_in_days: average(lower, 'trading_days'),
    lower_touch_count: lowerCount,
    lower_touch_accuracy: lowerCount
      ? lower.filter((item) => item.bounce_dollars > 0).length / lowerCount
      : null,
  };
};

const build = (a5, a10, cfg) =>
  cfg.map(({ key, lbl, tip, d = 2, pct, vis, flip }) => {
    let rawS = a5[key];
    let rawM = a10[key];

    if (flip) {
      rawS = rawS != null ? -rawS : rawS;
      rawM = rawM != null ? -rawM : rawM;
    }

    const nS = pct ? rawS * 100 : rawS;
    const nM = pct ? rawM * 100 : rawM;

    let { f: sVal } = fmt(nS, d);
    let { f: mVal } = fmt(nM, d);

    if (pct) {
      sVal = `${sVal}%`;
      mVal = `${mVal}%`;
    }

    return {
      label: lbl,
      hint: tip,
      sVal,
      mVal,
      sRaw: nS,
      mRaw: nM,
      visual: vis,
    };
  });

const pickInitialMode = (a5, a10) => {
  const avg = vals =>
    vals.filter(v => v !== null && v !== undefined && !isNaN(v))
        .reduce((s, v) => s + v, 0) /
    (vals.filter(v => v !== null && v !== undefined && !isNaN(v)).length || 1);

  const resWin = avg([a5.upper_touch_accuracy, a10.upper_touch_accuracy]);
  const supWin = avg([a5.lower_touch_accuracy, a10.lower_touch_accuracy]);

  return resWin > supWin ? 'res' : 'sup';
};

const BollingerMicroPanel = ({ summary, range = '3M' }) => {
  const chartPoints = useMemo(() => summary?.chart_data ?? [], [summary?.chart_data]);
  const latestTimestamp = useMemo(() => {
    if (!chartPoints.length) return null;
    return parseTimestamp(chartPoints[chartPoints.length - 1].date);
  }, [chartPoints]);
  const rangeStartTimestamp = useMemo(
    () => getRangeStartTimestamp(latestTimestamp, range),
    [latestTimestamp, range]
  );
  const window5 = summary?.window_5;
  const window10 = summary?.window_10;
  const rangeWindow5 = useMemo(
    () => ({
      lower_touch_bounces: filterByRange(window5?.lower_touch_bounces, rangeStartTimestamp),
      upper_touch_pullbacks: filterByRange(window5?.upper_touch_pullbacks, rangeStartTimestamp),
    }),
    [window5, rangeStartTimestamp]
  );
  const rangeWindow10 = useMemo(
    () => ({
      lower_touch_bounces: filterByRange(window10?.lower_touch_bounces, rangeStartTimestamp),
      upper_touch_pullbacks: filterByRange(window10?.upper_touch_pullbacks, rangeStartTimestamp),
    }),
    [window10, rangeStartTimestamp]
  );
  /* stable refs for a5 / a10 so ESLint is happy */
  const a5  = useMemo(() => computeTouchAggregates(rangeWindow5), [rangeWindow5]);
  const a10 = useMemo(() => computeTouchAggregates(rangeWindow10), [rangeWindow10]);

  const [mode, setMode] = useState(() => pickInitialMode(a5, a10));

  useEffect(() => {
    setMode(pickInitialMode(a5, a10));
  }, [a5, a10]); // deps now stable, no more warning

  /* guard AFTER hooks have run */
  if (!summary) return null;

  /* row definitions */
  const resCfg = [
    { lbl: 'Win Rate',            tip: '% of drops within 5 & 10 days',  key: 'upper_touch_accuracy', d: 0, pct: true, vis: 'donut' },
    { lbl: 'Expected Return',     tip: 'Expected % return after touching upper band', key: 'avg_upper_touch_drop', vis: 'vbar', flip: true },
    { lbl: 'Entry Opportunities', tip: 'Upper-band touch count',         key: 'upper_touch_count', d: 0, vis: 'single' },
    { lbl: 'Exit Day',            tip: 'Avg days until maximum drop',    key: 'avg_upper_touch_in_days', d: 1, vis: 'bar' },
  ];

  const supCfg = [
    { lbl: 'Win Rate',            tip: '% of bounces within 5 & 10 days', key: 'lower_touch_accuracy', d: 0, pct: true, vis: 'donut' },
    { lbl: 'Expected Return',     tip: 'Expected % return after touching lower band', key: 'avg_lower_touch_bounce', vis: 'vbar' },
    { lbl: 'Entry Opportunities', tip: 'Lower-band touch count',         key: 'lower_touch_count', d: 0, vis: 'single' },
    { lbl: 'Exit Day',            tip: 'Avg days until maximum bounce',  key: 'avg_lower_touch_bounce_in_days', d: 1, vis: 'bar' },
  ];

  const rows = mode === 'res' ? build(a5, a10, resCfg) : build(a5, a10, supCfg);

  return (
    <Paper>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <TimelineRounded sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Strategy Stats
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              py: 0,
              px: 1,
              fontSize: 12,
              minWidth: 56,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                backgroundColor: 'rgba(0,123,255,0.15)',
              },
            },
          }}
        >
          <ToggleButton value="res">UpperBB</ToggleButton>
          <ToggleButton value="sup">LowerBB</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {rows.map((r, i) => (
        <StatRowVisual key={i} {...r} />
      ))}

      <Divider sx={{ mb: 1 }} />
      <Typography variant="caption" sx={{ px: 1, opacity: 0.65, display: 'block' }}>
        <strong>S</strong> – 5-Day&nbsp;&nbsp;|&nbsp;&nbsp;<strong>M</strong> – 10-Day
      </Typography>
    </Paper>
  );
};

export default BollingerMicroPanel;
