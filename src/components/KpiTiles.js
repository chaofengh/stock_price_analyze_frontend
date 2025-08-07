import React from 'react';
import { Paper, Box, Typography, Tooltip } from '@mui/material';

/* — helper to colour-code vs. peer — */
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

/* — single pill card — */
const Pill = ({ label, value, peer, color, tip }) => {
  const body = (
    <Paper
      elevation={0}                         /* ← no shadow */
      sx={{
        p: 2,
        borderRadius: 3,
        minHeight: 90,
        bgcolor: 'rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',              /* ← center content */
        textAlign: 'center',               /* ← center text */
        gap: 0.5,
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase' }}>
        {label}
      </Typography>

      <Typography variant="h6" fontWeight="bold" sx={{ color }}>
        {value}
      </Typography>

      {peer != null && (
        <Typography variant="caption" sx={{ opacity: 0.75 }}>
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

/* — main component — */
const KpiTiles = ({ summary }) => {
  if (!summary) return null;

  const tips = {
    'Trailing PE': 'Lower trailing-P/E than peers often signals undervaluation.',
    'Forward P/E': 'Lower forward-P/E can mean cheaper future earnings.',
    PGI: 'Lower PGI suggests a more attractive valuation.',
    Beta: 'Lower beta → less volatility.'
  };

  const fmt = (n) => (n != null ? n.toFixed(2) : '-');

  /* — define tiles (Price Change removed) — */
  const tiles = [
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
      label: 'Market Cap',
      value:
        summary.marketCap != null
          ? `$${(summary.marketCap / 1e12).toFixed(2)} T`
          : '-'
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
          value={t.value ?? fmt(t.raw)}
          peer={t.peer != null ? fmt(t.peer) : null}
          color={deltaColor(t.raw, t.peer, t.lowerBetter)}
          tip={tips[t.label]}
        />
      ))}
    </Box>
  );
};

export default KpiTiles;
