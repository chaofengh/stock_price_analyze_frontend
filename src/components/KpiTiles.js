import React from 'react';
import { Paper, Box, Typography, Tooltip } from '@mui/material';

/* colour helper vs. peer avg */
const deltaColor = (raw, peer, lowerBetter = true) => {
  if (raw == null || peer == null || !isFinite(raw) || !isFinite(peer)) return 'text.primary';
  return lowerBetter
    ? raw < peer
      ? '#2ecc71'
      : raw > peer
      ? '#e74c3c'
      : 'text.primary'
    : raw > peer
    ? '#2ecc71'
    : raw < peer
    ? '#e74c3c'
    : 'text.primary';
};

/* compact Market Cap formatter: $, then T/B/M/K with adaptive decimals */
const formatMarketCap = (n) => {
  if (n == null || !isFinite(n)) return '-';

  const abs = Math.abs(n);
  const units = [
    { v: 1e12, s: 'T' },
    { v: 1e9,  s: 'B' },
    { v: 1e6,  s: 'M' },
    { v: 1e3,  s: 'K' },
  ];

  for (const u of units) {
    if (abs >= u.v) {
      const val = n / u.v;
      const digits = val >= 100 ? 0 : val >= 10 ? 1 : 2;
      return `$${val.toFixed(digits)} ${u.s}`;
    }
  }

  return `$${Math.round(n).toLocaleString()}`;
};

/* pill component */
const Pill = ({ label, value, peer, color, tip }) => {
  const body = (
    <Paper
      elevation={0}
      square
      sx={{
        p: 2,
        boxShadow: 'none !important',
        borderRadius: 3,
        minHeight: 90,
        bgcolor: 'rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: 0.5
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: '#fafafa', textTransform: 'uppercase', fontWeight: 600 }}
      >
        {label}
      </Typography>

      <Typography variant="h6" fontWeight="bold" sx={{ color }}>
        {value}
      </Typography>

      {peer != null && (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Peer Avg&nbsp;{peer}
        </Typography>
      )}
    </Paper>
  );

  return tip ? (
    <Tooltip title={tip} arrow>
      {body}
    </Tooltip>
  ) : (
    body
  );
};

const KpiTiles = ({ summary }) => {
  if (!summary) return null;

  const tips = {
    'Trailing PE': 'Lower trailing-P/E than peers often signals undervaluation.',
    'Forward P/E': 'Lower forward-P/E can mean cheaper future earnings.',
    PEG: 'PEG adjusts P/E for growth. Lower is generally better; < 1 often suggests growth-adjusted value.',
    PGI: 'Lower PGI suggests a more attractive valuation.',
    Beta: 'Lower beta → less volatility.'
  };

  const f = (n) => (n != null && isFinite(n) ? n.toFixed(2) : '-');

  /* tiles (Price Change already removed) */
  const tiles = [
    {
      label: 'Market Cap',
      value: formatMarketCap(summary.marketCap)
    },
    {
      label: 'Trailing PE',
      raw: summary.trailingPE,
      peer: summary.avg_peer_trailingPE,
      lowerBetter: true
    },
    {
      label: 'Forward P/E',
      raw: summary.forwardPE,
      peer: summary.avg_peer_forwardPE,
      lowerBetter: true
    },
    /* NEW: PEG ratio */
    {
      label: 'PEG',
      raw: summary.PEG,                 // <- backend-provided
      peer: summary.avg_peer_PEG,       // <- backend-provided
      lowerBetter: true
    },
    {
      label: 'PGI',
      raw: summary.PGI,
      peer: summary.avg_peer_PGI,
      lowerBetter: true
    },
    {
      label: 'Beta',
      raw: summary.beta,
      peer: summary.avg_peer_beta,
      lowerBetter: true
    },
    {
      label: 'Dividend Yield',
      value:
        summary.dividendYield != null && isFinite(summary.dividendYield)
          ? `${summary.dividendYield.toFixed(2)}%`
          : '-'
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography
        variant="subtitle1"
        sx={{
          textAlign: 'center',
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: 'text.secondary'
        }}
      >
        Fundamental
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
        }}
      >
        {tiles.map((t) => (
          <Pill
            key={t.label}
            label={t.label}
            value={t.value ?? f(t.raw)}
            peer={t.peer != null ? f(t.peer) : null}
            color={deltaColor(t.raw, t.peer, t.lowerBetter)}
            tip={tips[t.label]}
          />
        ))}
      </Box>
    </Box>
  );
};

export default KpiTiles;
