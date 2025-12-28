// src/components/SideBar/PeopleAlsoView/PeerRow.js
import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
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
    <Box
      component="button"
      onClick={() => onClick(peerSymbol)}
      // reset the default <button> look
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        padding: theme.spacing(1.5),
        mb: 1.5,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'background-color 0.15s ease-in-out',
        backgroundColor: 'transparent',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0,123,255,0.16), rgba(0,0,0,0))',
          transform: 'translateX(-100%)',
          transition: 'transform 0.35s',
          zIndex: 0,
        },
        '& > *': {
          position: 'relative',
          zIndex: 1,
        },
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        },
        '&:hover::before': {
          transform: 'translateX(0)',
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
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
    </Box>
  );
};

export default PeerRow;
