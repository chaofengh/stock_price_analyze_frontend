import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Grow,
  Grid,
  Divider
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import SparklineChart from './SparklineChart';

const formatPrice = (price) =>
  typeof price === 'number' ? price.toFixed(2) : price;

// Decide color sets for 'Upper' vs. 'Lower'
const sideStyles = {
  Upper: {
    bgColor: '#ffebee',
    textColor: '#c62828',
    icon: <ArrowUpward sx={{ color: '#c62828 !important' }} />,
    label: 'Crossed Above Upper Band'
  },
  Lower: {
    bgColor: '#e8f5e9',
    textColor: '#2e7d32',
    icon: <ArrowDownward sx={{ color: '#2e7d32 !important' }} />,
    label: 'Crossed Below Lower Band'
  }
};

const AlertItem = ({ alert, bandSide, onViewDetails, isSmallScreen }) => {
  const { symbol, close_price, bb_upper, bb_lower, recent_closes = [] } = alert;
  const styleSet = sideStyles[bandSide] || sideStyles.Upper;

  return (
    <Grow in timeout={500}>
      <Box
        sx={{
          p: 1,
          mb: 1,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#fff'
        }}
      >
        {/* Top row: Symbol + "Crossed" Chip + Sparkline */}
        <Box
          display="flex"
          flexDirection={isSmallScreen ? 'column' : 'row'}
          alignItems={isSmallScreen ? 'flex-start' : 'center'}
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          {/* Symbol + Chip */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant={isSmallScreen ? 'subtitle2' : 'subtitle1'}
              fontWeight="bold"
            >
              {symbol}
            </Typography>
            <Chip
              label={styleSet.label}
              size="small"
              sx={{
                backgroundColor: styleSet.bgColor,
                color: styleSet.textColor,
                fontWeight: 500
              }}
              icon={styleSet.icon}
            />
          </Box>

          {/* Mini Sparkline chart showing last 7 closes */}
          {recent_closes.length > 0 && (
            <Box
              sx={{
                width: isSmallScreen ? '100%' : '120px',
                mt: isSmallScreen ? 1 : 0
              }}
            >
              <SparklineChart data={recent_closes} bandSide={bandSide} />
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Middle row: Key prices */}
        <Grid container spacing={1}>
          <Grid item xs={6} sm={4} md={3}>
            <Typography variant={isSmallScreen ? 'body2' : 'body1'}>
              <strong>Close:</strong> {formatPrice(close_price)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Typography variant={isSmallScreen ? 'body2' : 'body1'}>
              <strong>BB Upper:</strong> {formatPrice(bb_upper)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Typography variant={isSmallScreen ? 'body2' : 'body1'}>
              <strong>BB Lower:</strong> {formatPrice(bb_lower)}
            </Typography>
          </Grid>
        </Grid>

        {/* Bottom row: "View Details" button */}
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Button variant="outlined" size="small" onClick={() => onViewDetails(symbol)}>
            View Details
          </Button>
        </Box>
      </Box>
    </Grow>
  );
};

export default AlertItem;
