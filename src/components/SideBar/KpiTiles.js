import React from 'react';
import { Grid, Paper, Typography, Box, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Custom styled Tooltip with enhanced design
const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  // Custom tooltip container styling
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[3],
    fontSize: '0.875rem',
    border: '1px solid #dadde9',
    borderRadius: 8,
    padding: '8px 12px',
    maxWidth: 220,
  },
  // Custom arrow styling to match the tooltip background
  '& .MuiTooltip-arrow': {
    color: theme.palette.background.paper,
  },
}));

const KpiTiles = ({ summary }) => {
  if (!summary) return null;

  // Calculate price change details.
  const priceChange = summary.price_change_in_dollars;
  const priceChangeColor =
    priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'textPrimary';
  const priceChangeIcon =
    priceChange > 0 ? (
      <TrendingUpIcon fontSize="small" sx={{ color: priceChangeColor, mr: 0.5 }} />
    ) : priceChange < 0 ? (
      <TrendingDownIcon fontSize="small" sx={{ color: priceChangeColor, mr: 0.5 }} />
    ) : null;

  // Tooltip descriptions for metrics with peer comparisons.
  const tooltipDescriptions = {
    'Trailing PE': 'A lower trailing P/E relative to peers indicates a potentially undervalued stock. Higher values may signal overvaluation.',
    'PGI': 'A lower PGI relative to peers indicates a more favorable valuation. Higher values may signal overvaluation.',
    'Beta': 'A lower beta than the peer average suggests lower volatility and potentially lower risk.',
    'Forward P/E': 'A lower forward P/E relative to peers suggests a more attractive valuation. Higher values may indicate overvaluation.'
  };

  // Helper: assign a color based on the company's metric vs. the peer average.
  const getValueColor = (companyValue, peerAvg, isLowerBetter = true) => {
    if (companyValue == null || peerAvg == null) return 'textPrimary';
    if (isLowerBetter) {
      return companyValue < peerAvg ? 'green' : companyValue > peerAvg ? 'red' : 'textPrimary';
    } else {
      return companyValue > peerAvg ? 'green' : companyValue < peerAvg ? 'red' : 'textPrimary';
    }
  };

  // Define the tiles.
  const tiles = [
    {
      label: 'Price Change',
      value:
        summary.price_change_in_dollars != null
          ? `$${summary.price_change_in_dollars.toFixed(2)}`
          : '-',
      extra:
        summary.percentage_change != null ? (
          <Typography variant="caption" sx={{ color: priceChangeColor }}>
            {`${summary.percentage_change.toFixed(2)}%`}
          </Typography>
        ) : '',
      icon: priceChangeIcon,
      color: priceChangeColor
    },
    {
      label: 'Trailing PE',
      rawValue: summary.trailingPE,
      value: summary.trailingPE != null ? summary.trailingPE.toFixed(2) : '-',
      peerAvg: summary.avg_peer_trailingPE,
      isLowerBetter: true
    },
    {
      label: 'PGI',
      rawValue: summary.PGI,
      value: summary.PGI != null ? summary.PGI.toFixed(2) : '-',
      peerAvg: summary.avg_peer_PGI,
      isLowerBetter: true
    },
    {
      label: 'Forward P/E',
      rawValue: summary.forwardPE,
      value:
        summary.forwardPE != null ? summary.forwardPE.toFixed(2) : '-',
      peerAvg: summary.avg_peer_forwardPE,
      isLowerBetter: true
    },
    {
      label: 'Beta',
      rawValue: summary.beta,
      value: summary.beta != null ? summary.beta.toFixed(2) : '-',
      peerAvg: summary.avg_peer_beta,
      isLowerBetter: true
    },
    {
      label: 'Market Cap',
      value:
        summary.marketCap != null
          ? `$${(summary.marketCap / 1e12).toFixed(2)}T`
          : '-'
    },
    {
      label: 'Dividend Yield',
      value:
        summary.dividendYield != null
          ? `${summary.dividendYield.toFixed(2)}%`
          : '-'
    },
  ];

  return (
    <Grid container spacing={3}>
      {tiles.map((tile, idx) => {
        const { label, value, extra, icon, color, peerAvg, rawValue, isLowerBetter } = tile;
        const valueColor =
          peerAvg != null && rawValue != null
            ? getValueColor(rawValue, peerAvg, isLowerBetter)
            : 'textPrimary';
        const tooltipText =
          peerAvg != null ? tooltipDescriptions[label] || 'Lower than peer average is considered favorable.' : '';

        const tileContent = (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, backgroundColor:'rgba(20, 133, 203, 0.2)' }} elevation={1}>
            <Typography variant="caption" color="textSecondary">
              {label}
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" mt={1} >
              {icon}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: label === 'Price Change' ? color : valueColor
                }}
              >
                {value}
              </Typography>
            </Box>
            {extra && label === 'Price Change' && <Box mt={1}>{extra}</Box>}
            {peerAvg != null && rawValue != null && label !== 'Price Change' && (
              <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                Peer Avg: {peerAvg.toFixed(2)}
              </Typography>
            )}
          </Paper>
        );

        return (
          <Grid item xs={12} sm={6} key={idx}>
            {tooltipText && label !== 'Price Change' ? (
              <CustomTooltip title={tooltipText}>
                {tileContent}
              </CustomTooltip>
            ) : (
              tileContent
            )}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default KpiTiles;
