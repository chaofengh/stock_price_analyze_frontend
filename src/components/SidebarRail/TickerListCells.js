import React, { useEffect, useId } from 'react';
import { Area, AreaChart } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { alpha, useTheme } from '@mui/material/styles';
import { Avatar, Box, Chip, Typography } from '@mui/material';
import { ensureLogoForSymbol, selectLogoUrlBySymbol } from '../Redux/logosSlice';

function TrendCell({ closePrices }) {
  const theme = useTheme();
  const gradientId = `trend-${useId().replace(/:/g, '')}`;

  if (!closePrices || closePrices.length === 0) return null;
  const firstClose = closePrices[0];
  const lastClose = closePrices[closePrices.length - 1];
  const isUp = lastClose >= firstClose;
  const stroke = isUp ? theme.palette.success.main : theme.palette.error.main;
  const fillTop = alpha(stroke, 0.35);
  const fillBottom = alpha(stroke, 0.02);

  const min = Math.min(...closePrices);
  const max = Math.max(...closePrices);
  const range = max - min;
  const data = closePrices.map((close, idx) => ({
    idx,
    close,
    value: range === 0 ? 0.5 : (close - min) / range,
  }));

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <AreaChart width={140} height={40} data={data} margin={{ top: 6, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillTop} />
            <stop offset="100%" stopColor={fillBottom} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={stroke}
          fill={`url(#${gradientId})`}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </Box>
  );
}

function SymbolCell({ symbol, pending }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const logoUrl = useSelector((state) => selectLogoUrlBySymbol(state, symbol));

  useEffect(() => {
    dispatch(ensureLogoForSymbol(symbol));
  }, [dispatch, symbol]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1,
        height: '100%',
        minWidth: 0,
        width: '100%',
      }}
    >
      <Avatar
        src={logoUrl || undefined}
        alt={symbol}
        sx={{
          width: 28,
          height: 28,
          bgcolor: alpha(theme.palette.common.white, 0.08),
          border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
        }}
        variant="rounded"
      >
        <Typography variant="caption" sx={{ color: 'text.secondaryBright', fontWeight: 800 }}>
          {symbol?.[0]?.toUpperCase() || '?'}
        </Typography>
      </Avatar>
      <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: 0.2 }} noWrap>
        {symbol}
      </Typography>
      {pending && (
        <Chip
          size="small"
          label="Pending"
          sx={{
            height: 20,
            fontWeight: 800,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.warning.main, 0.16),
            color: theme.palette.warning.light,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
          }}
        />
      )}
    </Box>
  );
}

export { TrendCell, SymbolCell };
