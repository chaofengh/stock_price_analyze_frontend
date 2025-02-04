// StatCard.js
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const StatCard = ({ label, value, change }) => {
  // Ensure numeric comparison for change, if provided.
  const isPositive = parseFloat(change) >= 0;
  
  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 2,
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
        p: 1,
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" color="textSecondary">
          {label}
        </Typography>
        <Box display="flex" alignItems="center" mt={1}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          {change !== null && change !== undefined && (
            <Box display="flex" alignItems="center" ml={2}>
              {isPositive ? (
                <ArrowUpwardIcon fontSize="small" sx={{ color: 'green', mr: 0.5 }} />
              ) : (
                <ArrowDownwardIcon fontSize="small" sx={{ color: 'red', mr: 0.5 }} />
              )}
              <Typography variant="body2" sx={{ color: isPositive ? 'green' : 'red' }}>
                {Math.abs(change)}%
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
