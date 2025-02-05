// DualStatCard.js
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const DualStatCard = ({ label, value5, trend5, value10, trend10 }) => {
  const renderIcon = (trend) => {
    if (trend === 'up') {
      return <ArrowUpwardIcon fontSize="small" sx={{ color: 'green', ml: 0.5 }} />;
    } else if (trend === 'down') {
      return <ArrowDownwardIcon fontSize="small" sx={{ color: 'red', ml: 0.5 }} />;
    }
    return null;
  };

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 2,
        p: 1,
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" color="textSecondary">
          {label}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Box textAlign="center">
            <Typography variant="caption" color="textSecondary">
              5-Day
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center">
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: trend5 === 'up' ? 'green' : trend5 === 'down' ? 'red' : 'textPrimary',
                }}
              >
                {value5}
              </Typography>
              {renderIcon(trend5)}
            </Box>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" color="textSecondary">
              10-Day
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center">
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: trend10 === 'up' ? 'green' : trend10 === 'down' ? 'red' : 'textPrimary',
                }}
              >
                {value10}
              </Typography>
              {renderIcon(trend10)}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DualStatCard;
