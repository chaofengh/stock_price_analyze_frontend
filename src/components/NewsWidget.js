// NewsWidget.js
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const NewsWidget = () => {
  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        News & Analysis
      </Typography>
      <Box sx={{ mt: 2, color: 'text.secondary' }}>
        <Typography variant="body2">
          Coming Soon: Latest headlines, expert opinions, and financial news updates.
        </Typography>
      </Box>
    </Paper>
  );
};

export default NewsWidget;
