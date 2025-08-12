import React from 'react';
import { Box, Fade, IconButton, Paper, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Small card that appears after a drag-zoom,
 * showing absolute / % price change over the selected range.
 */
const PriceChangeInfo = ({ dragInfo, onResetZoom }) => {
  if (!dragInfo) return null;

  const { startDate, endDate, duration, diff, pct } = dragInfo;
  const isGain = parseFloat(diff) >= 0;

  return (
    <Fade in timeout={500}>
      <Paper
        elevation={0} // flat look
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          p: 2,
          borderRadius: 2,
          minWidth: 240,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Price Change
          </Typography>
          <IconButton
            size="small"
            color="primary"
            aria-label="Reset Zoom"
            onClick={onResetZoom}
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* body */}
        <Typography variant="body2" fontWeight={500}>
          From: {startDate}
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          To:&nbsp;&nbsp;&nbsp;&nbsp;{endDate}
        </Typography>
        <Typography variant="body1" fontWeight={700}>
          Duration: {duration} day{duration > 1 ? 's' : ''}
        </Typography>
        <Typography
          variant="body1"
          fontWeight={700}
          color={isGain ? 'success.main' : 'error.main'}
        >
          {isGain ? '+' : ''}
          ${diff} ({pct}%)
        </Typography>
      </Paper>
    </Fade>
  );
};

export default PriceChangeInfo;
