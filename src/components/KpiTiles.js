import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const KpiTiles = ({ summary }) => {
  if (!summary) return null;
  console.log(summary);

  const priceChange = summary.price_change_in_dollars;
  const priceChangeColor =
    priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'textPrimary';
  const priceChangeIcon =
    priceChange > 0 ? (
      <TrendingUpIcon fontSize="small" sx={{ color: 'green', mr: 0.5 }} />
    ) : priceChange < 0 ? (
      <TrendingDownIcon fontSize="small" sx={{ color: 'red', mr: 0.5 }} />
    ) : null;
  const percentageChange = summary.percentage_change;

  const tiles = [
    {
      label: 'Price Change',
      value: priceChange != null ? `$${priceChange.toFixed(2)}` : '-',
      extra: percentageChange != null ? `${percentageChange.toFixed(2)}%` : '',
      icon: priceChangeIcon,
      color: priceChangeColor,
    },
    {
      label: 'Current Price',
      value:
        summary.final_price != null
          ? `$${summary.final_price.toFixed(2)}`
          : '-',
    },
    {
      label: 'Trailing PE',
      value:
        summary.trailingPE != null ? summary.trailingPE.toFixed(2) : '-',
    },
    {
      label: 'PEG',
      value: summary.PEG != null ? summary.PEG.toFixed(2) : '-',
    },
    // New insightful metrics
    {
      label: 'Beta',
      value: summary.beta != null ? summary.beta.toFixed(2) : '-',
    },
    {
      label: 'Market Cap',
      value:
        summary.marketCap != null
          ? `$${(summary.marketCap / 1e12).toFixed(2)}T`
          : '-',
    },
    {
      label: 'Dividend Yield',
      value:
        summary.dividendYield != null
          ? `${(summary.dividendYield * 100).toFixed(2)}%`
          : '-',
    },
    {
      label: 'Forward P/E',
      value:
        summary.forwardPE != null ? summary.forwardPE.toFixed(2) : '-',
    },
  ];

  return (
    <Grid container spacing={3}>
      {tiles.map(({ label, value, extra, icon, color }, idx) => (
        <Grid item xs={12} sm={6} key={idx}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4 }} elevation={1}>
            <Typography variant="caption" color="textSecondary">
              {label}
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
              {icon}
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: color || 'textPrimary' }}>
                {value}
              </Typography>
            </Box>
            {extra && (
              <Typography variant="caption" color="textSecondary">
                {extra}
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default KpiTiles;
