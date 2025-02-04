// KpiTiles.js
import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

function KpiTiles({ summary }) {
  if (!summary) return null;

  // Function to pick the appropriate color based on value
  const getColor = (value) => {
    if (value > 0) return 'green';
    else if (value < 0) return 'red';
    return 'textPrimary';
  };

  const tiles = [
    {
      label: 'Price Change',
      value:
        summary.price_change_in_dollars != null
          ? `$${summary.price_change_in_dollars.toFixed(2)}`
          : '-',
      icon:
        summary.price_change_in_dollars > 0 ? (
          <TrendingUpIcon color="success" />
        ) : (
          <TrendingDownIcon color="error" />
        ),
      color: getColor(summary.price_change_in_dollars),
    },
    {
      label: 'Final Price',
      value:
        summary.final_price != null
          ? `$${summary.final_price.toFixed(2)}`
          : '-',
      // Final Price is usually static; no icon needed.
      icon: null,
      color: 'textPrimary',
    },
    {
      label: 'Trading Days',
      value: summary.trading_days != null ? summary.trading_days : '-',
      icon: null,
      color: 'textPrimary',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {tiles.map(({ label, value, icon, color }) => (
        <Grid item xs={12} sm={4} key={label}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              textAlign: 'center',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 6,
              },
            }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              {label}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 1,
              }}
            >
              {icon} {value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default KpiTiles;
