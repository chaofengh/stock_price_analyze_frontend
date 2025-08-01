import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
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

/* convert summary → rows */
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
      visual: vis, // 'donut' | 'vbar' | 'single' | 'bar'
    };
  });

const BollingerMicroPanel = ({ summary }) => {
  const [mode, setMode] = useState('sup');
  if (!summary) return null;

  const a5  = summary.aggregated_window_5  || {};
  const a10 = summary.aggregated_window_10 || {};

  /* row definitions (order & visuals) */
  const resCfg = [
    { lbl: 'Win Rate',            tip: '% of drops within 5 & 10 days',
      key: 'upper_touch_accuracy',        d: 0, pct: true, vis: 'donut' },
    { lbl: 'Expected Return',     tip: 'Expected % return after touching upper band',
      key: 'avg_upper_touch_drop',        vis: 'vbar', flip: true },
    { lbl: 'Entry Opportunities', tip: 'Upper-band touch count',
      key: 'upper_touch_count',          d: 0, vis: 'single' },
    { lbl: 'Exit Day',            tip: 'Avg days until maximum drop',
      key: 'avg_upper_touch_in_days',    d: 1, vis: 'bar' },
  ];

  const supCfg = [
    { lbl: 'Win Rate',            tip: '% of bounces within 5 & 10 days',
      key: 'lower_touch_accuracy',        d: 0, pct: true, vis: 'donut' },
    { lbl: 'Expected Return',     tip: 'Expected % return after touching lower band',
      key: 'avg_lower_touch_bounce',      vis: 'vbar' },
    { lbl: 'Entry Opportunities', tip: 'Lower-band touch count',
      key: 'lower_touch_count',          d: 0, vis: 'single' },
    { lbl: 'Exit Day',            tip: 'Avg days until maximum bounce',
      key: 'avg_lower_touch_bounce_in_days', d: 1, vis: 'bar' },
  ];

  const rows = mode === 'res' ? build(a5, a10, resCfg) : build(a5, a10, supCfg);

  return (
    <Box sx={{ mb: 2 }}>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <TimelineRounded sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Bollinger Stats
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
          <ToggleButton value="res">Res</ToggleButton>
          <ToggleButton value="sup">Sup</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {rows.map((r, i) => (
        <StatRowVisual key={i} {...r} />
      ))}

      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" sx={{ px: 1, opacity: 0.65, display: 'block' }}>
        <strong>S</strong> – 5-Day&nbsp;&nbsp;|&nbsp;&nbsp;<strong>M</strong> – 10-Day
      </Typography>
    </Box>
  );
};

export default BollingerMicroPanel;
