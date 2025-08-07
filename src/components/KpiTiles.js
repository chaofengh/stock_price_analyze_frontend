import React from 'react';
import { Paper, Box, Typography, Tooltip } from '@mui/material';

/* colour helper vs. peer avg */
const deltaColor = (raw, peer, lowerBetter = true) => {
  if (raw == null || peer == null) return 'text.primary';
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

/* pill component */
const Pill = ({ label, value, peer, color, tip }) => {
  const body = (
    <Paper
      elevation={0}               /* ← remove Material shadow */
      square                     /* no extra corner rounding logic */
      sx={{
        p: 2,
        boxShadow: 'none !important',   /* ← enforce zero shadow */
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
        sx={{
          color: '#fafafa',       /* brighter white label */
          textTransform: 'uppercase',
          fontWeight: 600
        }}
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
    PGI: 'Lower PGI suggests a more attractive valuation.',
    Beta: 'Lower beta → less volatility.'
  };

  const f = (n) => (n != null ? n.toFixed(2) : '-');

  /* tiles (Price Change already removed) */
  const tiles = [
    {
      label: 'Market Cap',
      value:
        summary.marketCap != null
          ? `$${(summary.marketCap / 1e12).toFixed(2)} T`
          : '-'
    },
    {
      label: 'Trailing PE',
      raw: summary.trailingPE,
      peer: summary.avg_peer_trailingPE,
      lowerBetter: true
    },
    {
      label: 'PGI',
      raw: summary.PGI,
      peer: summary.avg_peer_PGI,
      lowerBetter: true
    },
    {
      label: 'Forward P/E',
      raw: summary.forwardPE,
      peer: summary.avg_peer_forwardPE,
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
        summary.dividendYield != null
          ? `${summary.dividendYield.toFixed(2)}%`
          : '-'
    }
  ];

  return (
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
  );
};

export default KpiTiles;
