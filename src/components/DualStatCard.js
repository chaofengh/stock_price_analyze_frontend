import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const DualStatCard = ({ label, value5, trend5, value10, trend10 }) => {
  const renderIcon = (trend) => {
    if (trend === 'up') {
      return <ArrowUpwardIcon fontSize="small" sx={{ color: 'green' }} />;
    } else if (trend === 'down') {
      return <ArrowDownwardIcon fontSize="small" sx={{ color: 'red' }} />;
    }
    return null;
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        p: 2,
        transition: 'transform 0.3s',
        '&:hover': { transform: 'scale(1.02)' },
      }}
      elevation={1}
    >
      <CardContent sx={{ p: 0 }}>
        <Typography variant="caption" color="textSecondary">
          {label}
        </Typography>
        <Box mt={1} display="flex" justifyContent="space-between">
          <Box textAlign="center">
            <Typography variant="caption" color="textSecondary">
              5-Day
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center">
              {renderIcon(trend5)}
              <Typography variant="h6" sx={{ fontWeight: 'medium', ml: 0.5 }}>
                {value5}
              </Typography>
            </Box>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" color="textSecondary">
              10-Day
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center">
              {renderIcon(trend10)}
              <Typography variant="h6" sx={{ fontWeight: 'medium', ml: 0.5 }}>
                {value10}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DualStatCard;
