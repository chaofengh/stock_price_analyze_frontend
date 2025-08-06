import React from 'react';
import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';
import MiniAreaLine from './MiniAreaLine';

/**
 * Row representing a single peer symbol
 *
 * Props:
 *  • peerSymbol  – string (ticker)
 *  • latest      – number | null
 *  • pct         – number | null (percentage change)
 *  • series      – number[] (intraday closes)
 *  • onClick     – function(symbol)   <-- injected by parent
 */
const PeerRow = ({ peerSymbol, latest, pct, series, onClick }) => {
  const theme    = useTheme();
  const positive = pct >= 0 || pct === null;
  const color    = positive ? theme.palette.primary.main : theme.palette.error.main;

  const chartData = series.slice(-50).map((v) => ({ v }));

  return (
    <Paper
      variant="outlined"
      onClick={() => onClick(peerSymbol)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        mb: 1.5,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
        },
      }}
    >
      {/* ticker + price */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700}>
          {peerSymbol}
        </Typography>
        {latest != null && (
          <Typography variant="body2" fontWeight={700}>
            {latest.toFixed(2)}
          </Typography>
        )}
      </Box>

      {/* % change */}
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{
          color: positive ? theme.palette.success.main : theme.palette.error.main,
          minWidth: 64,
          textAlign: 'right',
        }}
      >
        {pct == null ? '–' : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
      </Typography>

      {/* mini chart */}
      <Box sx={{ ml: 1 }}>
        {chartData.length ? (
          <MiniAreaLine data={chartData} color={color} />
        ) : (
          <Box sx={{ width: 80, height: 36 }} />
        )}
      </Box>
    </Paper>
  );
};

export default PeerRow;
