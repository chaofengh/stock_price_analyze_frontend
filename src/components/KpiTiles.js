import React, { useMemo } from 'react';
import { Paper, Box, Typography, Tooltip, Skeleton, Divider } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Legend);

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

const formatCurrencyCompact = (n) => {
  if (n == null || !isFinite(n)) return '-';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const units = [
    { v: 1e12, s: 'T' },
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' },
  ];

  for (const u of units) {
    if (abs >= u.v) {
      const val = abs / u.v;
      const digits = val >= 100 ? 0 : val >= 10 ? 1 : 2;
      return `${sign}$${val.toFixed(digits)} ${u.s}`;
    }
  }

  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

const formatPercent = (value) => {
  if (value == null || !isFinite(value)) return '-';
  return `${(value * 100).toFixed(2)}%`;
};

const formatMultiple = (value) => {
  if (value == null || !isFinite(value)) return '-';
  return `${value.toFixed(2)}x`;
};

const MetricTrendChart = ({ trend, fallbackValue }) => {
  const theme = useTheme();
  const [recent, prior] = useMemo(() => {
    const sanitize = (values) =>
      (values || []).map((v) => (Number.isFinite(v) ? v : null));
    const padToFour = (values) => {
      const trimmed = values.slice(0, 4);
      if (trimmed.length >= 4) return trimmed;
      return Array(4 - trimmed.length).fill(null).concat(trimmed);
    };
    const hasData = (values) => values.some((v) => v != null);

    const recentRaw = padToFour(sanitize(trend?.recent || []));
    const priorRaw = padToFour(sanitize(trend?.prior || []));
    const fallback =
      Number.isFinite(fallbackValue) ? Array(4).fill(fallbackValue) : [];

    const recentSeries = hasData(recentRaw) ? recentRaw : fallback;
    const priorSeries = hasData(priorRaw) ? priorRaw : fallback;

    if (!hasData(recentSeries || []) && !hasData(priorSeries || [])) {
      const empty = Array(4).fill(null);
      return [empty, empty];
    }

    return [
      (recentSeries || []).length ? recentSeries : Array(4).fill(null),
      (priorSeries || []).length ? priorSeries : Array(4).fill(null),
    ];
  }, [trend, fallbackValue]);

  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const data = {
    labels,
    datasets: [
      {
        label: 'Recent 4Q',
        data: recent,
        borderColor: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.12),
        borderWidth: 1.6,
        pointRadius: 0,
        tension: 0.35,
      },
      {
        label: 'Prior 4Q',
        data: prior,
        borderColor: theme.palette.warning.main,
        backgroundColor: alpha(theme.palette.warning.main, 0.12),
        borderWidth: 1.4,
        pointRadius: 0,
        tension: 0.35,
        borderDash: [4, 4],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: theme.palette.text.secondary,
          boxWidth: 10,
          boxHeight: 10,
          font: { size: 9 },
        },
      },
      tooltip: { enabled: false },
    },
    elements: { point: { radius: 0 } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <Box sx={{ width: '100%', height: 70 }}>
      <Line data={data} options={options} />
    </Box>
  );
};


/* pill component */
const Pill = ({ label, value, peer, color, tip, peerLoading = false, chart }) => {
  const body = (
    <Paper
      elevation={0}
      square
      sx={{
        p: 2,
        boxShadow: 'none !important',
        borderRadius: 3,
        minHeight: 140,
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

      {peer != null ? (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Peer Avg&nbsp;{peer}
        </Typography>
      ) : peerLoading ? (
        <Skeleton variant="text" width={80} height={14} />
      ) : null}

      {chart ? <Box sx={{ width: '100%', mt: 1 }}>{chart}</Box> : null}
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

const KpiTiles = ({ summary, isLoading = false, peerLoading = false }) => {
  if (isLoading) {
    const tiles = Array.from({ length: 21 });
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
          {tiles.map((_, idx) => (
            <Paper
              key={idx}
              elevation={0}
              square
              sx={{
                p: 2,
                boxShadow: 'none !important',
                borderRadius: 3,
                minHeight: 140,
                bgcolor: 'rgba(255,255,255,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: 1
              }}
            >
              <Skeleton variant="text" width={90} height={16} />
              <Skeleton variant="text" width={70} height={24} />
              <Skeleton variant="text" width={80} height={14} />
              <Skeleton variant="rectangular" width="100%" height={54} />
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }

  if (!summary) return null;

  const tips = {
    'Trailing PE': 'Lower trailing-P/E than peers often signals undervaluation.',
    'Forward P/E': 'Lower forward-P/E can mean cheaper future earnings.',
    PEG: 'PEG adjusts P/E for growth. Lower is generally better; < 1 often suggests growth-adjusted value.',
    PGI: 'Lower PGI suggests a more attractive valuation.',
    Beta: 'Lower beta → less volatility.',
    'Revenue/Employee': 'Revenue divided by total employees (proxy for per-head output).',
    'Gross Profit/Employee': 'Gross profit divided by total employees.',
    'Op Income/Employee': 'Operating income per employee (falls back to EBITDA when needed).',
    'SG&A/Employee': 'Selling, general & administrative spend per employee.',
    'Sales/Salesperson': 'Direct sales productivity; often unavailable in public data.',
    ROIC: 'NOPAT divided by invested capital.',
    ROA: 'Net income divided by total assets.',
    'Asset Turnover': 'Revenue divided by total assets.',
    'Capex Intensity': 'Capital expenditures divided by revenue.',
    'FCF Margin': 'Free cash flow divided by revenue.',
    'Gross Margin': 'Gross profit divided by revenue.',
    'Operating Margin': 'Operating income divided by revenue.',
    'SG&A % Rev': 'SG&A divided by revenue.',
    'R&D % Rev': 'R&D expense divided by revenue.'
  };

  const f = (n) => (n != null && isFinite(n) ? n.toFixed(2) : '-');

  /* tiles (Price Change already removed) */
  const metricTrends = summary.metricTrends || {};

  const valuationTiles = [
    {
      label: 'Market Cap',
      value: formatMarketCap(summary.marketCap),
      hasPeer: false
    },
    {
      label: 'Trailing PE',
      raw: summary.trailingPE,
      peer: summary.avg_peer_trailingPE,
      lowerBetter: true,
      hasPeer: true,
    },
    {
      label: 'Forward P/E',
      raw: summary.forwardPE,
      peer: summary.avg_peer_forwardPE,
      lowerBetter: true,
      hasPeer: true,
    },
    /* NEW: PEG ratio */
    {
      label: 'PEG',
      raw: summary.PEG,                 // <- backend-provided
      peer: summary.avg_peer_PEG,       // <- backend-provided
      lowerBetter: true,
      hasPeer: true,
    },
    {
      label: 'PGI',
      raw: summary.PGI,
      peer: summary.avg_peer_PGI,
      lowerBetter: true,
      hasPeer: true,
    },
    {
      label: 'Beta',
      raw: summary.beta,
      peer: summary.avg_peer_beta,
      lowerBetter: true,
      hasPeer: true,
    },
    {
      label: 'Dividend Yield',
      value:
        summary.dividendYield != null && isFinite(summary.dividendYield)
          ? `${summary.dividendYield.toFixed(2)}%`
          : '-',
      hasPeer: false
    }
  ];

  const productivityTiles = [
    {
      label: 'Revenue/Employee',
      value: formatCurrencyCompact(summary.revenuePerEmployee),
      trendKey: 'revenuePerEmployee',
      trendValue: summary.revenuePerEmployee,
    },
    {
      label: 'Gross Profit/Employee',
      value: formatCurrencyCompact(summary.grossProfitPerEmployee),
      trendKey: 'grossProfitPerEmployee',
      trendValue: summary.grossProfitPerEmployee,
    },
    {
      label: 'Op Income/Employee',
      value: formatCurrencyCompact(summary.operatingIncomePerEmployee),
      trendKey: 'operatingIncomePerEmployee',
      trendValue: summary.operatingIncomePerEmployee,
    },
    {
      label: 'SG&A/Employee',
      value: formatCurrencyCompact(summary.sgaPerEmployee),
      trendKey: 'sgaPerEmployee',
      trendValue: summary.sgaPerEmployee,
    },
    {
      label: 'Sales/Salesperson',
      value: formatCurrencyCompact(summary.salesPerSalesperson),
      trendKey: 'salesPerSalesperson',
      trendValue: summary.salesPerSalesperson,
    }
  ];

  const capitalTiles = [
    {
      label: 'ROIC',
      value: formatPercent(summary.roic),
      trendKey: 'roic',
      trendValue: summary.roic,
    },
    {
      label: 'ROA',
      value: formatPercent(summary.roa),
      trendKey: 'roa',
      trendValue: summary.roa,
    },
    {
      label: 'Asset Turnover',
      value: formatMultiple(summary.assetTurnover),
      trendKey: 'assetTurnover',
      trendValue: summary.assetTurnover,
    },
    {
      label: 'Capex Intensity',
      value: formatPercent(summary.capexIntensity),
      trendKey: 'capexIntensity',
      trendValue: summary.capexIntensity,
    },
    {
      label: 'FCF Margin',
      value: formatPercent(summary.freeCashFlowMargin),
      trendKey: 'freeCashFlowMargin',
      trendValue: summary.freeCashFlowMargin,
    }
  ];

  const efficiencyTiles = [
    {
      label: 'Gross Margin',
      value: formatPercent(summary.grossMargin),
      trendKey: 'grossMargin',
      trendValue: summary.grossMargin,
    },
    {
      label: 'Operating Margin',
      value: formatPercent(summary.operatingMargin),
      trendKey: 'operatingMargin',
      trendValue: summary.operatingMargin,
    },
    {
      label: 'SG&A % Rev',
      value: formatPercent(summary.sgaPercentRevenue),
      trendKey: 'sgaPercentRevenue',
      trendValue: summary.sgaPercentRevenue,
    },
    {
      label: 'R&D % Rev',
      value: formatPercent(summary.rdPercentRevenue),
      trendKey: 'rdPercentRevenue',
      trendValue: summary.rdPercentRevenue,
    }
  ];

  const sections = [
    { title: 'Valuation', tiles: valuationTiles },
    { title: 'Productivity', tiles: productivityTiles },
    { title: 'Capital Efficiency', tiles: capitalTiles },
    { title: 'Operating Efficiency', tiles: efficiencyTiles }
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
      {sections.map((section, idx) => (
        <Box key={section.title} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {idx > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />}
          <Typography
            variant="overline"
            sx={{ textAlign: 'center', letterSpacing: 1.2, color: 'text.secondary' }}
          >
            {section.title}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
            }}
          >
            {section.tiles.map((t) => (
              <Pill
                key={t.label}
                label={t.label}
                value={t.value ?? f(t.raw)}
                peer={t.peer != null ? f(t.peer) : null}
                color={deltaColor(t.raw, t.peer, t.lowerBetter)}
                tip={tips[t.label]}
                peerLoading={peerLoading && t.hasPeer}
                chart={
                  t.trendKey ? (
                    <MetricTrendChart
                      trend={metricTrends[t.trendKey]}
                      fallbackValue={t.trendValue ?? t.raw}
                    />
                  ) : null
                }
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default KpiTiles;
