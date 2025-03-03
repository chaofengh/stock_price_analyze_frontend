import React from 'react';
import { Box, Paper, Typography, IconButton, Fade } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const PriceChangeInfo = ({ dragInfo, onResetZoom }) => {
  if (!dragInfo) return null;
  
  return (
    <Fade in timeout={500}>
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          padding: 2,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: 2,
          minWidth: 240,
          color: 'text.primary',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Price Change
          </Typography>
          <IconButton
            onClick={onResetZoom}
            size="small"
            color="primary"
            aria-label="Reset Zoom"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          From: {dragInfo.startDate}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          To: {dragInfo.endDate}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Duration: {dragInfo.duration} day{dragInfo.duration > 1 ? 's' : ''}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 'bold',
            color: parseFloat(dragInfo.diff) >= 0 ? 'green' : 'red',
          }}
        >
          ${dragInfo.diff} ({dragInfo.pct}%)
        </Typography>
      </Paper>
    </Fade>
  );
};

export default PriceChangeInfo;
