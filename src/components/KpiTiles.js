// KpiTiles.js
import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

function KpiTiles({ summary }) {
  if (!summary) return null;

  const priceChange = summary.price_change_in_dollars;
  const priceChangeColor = priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'textPrimary';
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
      label: 'Final Price',
      value: summary.final_price != null ? `$${summary.final_price.toFixed(2)}` : '-',
    },
    {
      label: 'Trading Days',
      value: summary.trading_days ?? '-',
    },
    {
      label: 'PE Ratio',
      value: summary.PE_ratio ?? '-',
    },
    {
      label: 'PEG',
      value: summary.PEG ?? '-',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {tiles.map(({ label, value, extra, icon, color }, idx) => (
        <Grid item xs={12} sm={6} key={idx}>
          <Paper elevation={4} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
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
                ({extra})
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default KpiTiles;
