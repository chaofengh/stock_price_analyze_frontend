// GroupedAlerts.jsx

import React, { useState } from 'react';
import { Typography, Box, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import AlertItem from './AlertItem';

const GroupedAlerts = ({
  title,
  alerts,
  onViewDetails,
  isSmallScreen,
  touched_side
}) => {
  const [open, setOpen] = useState(true);

  const handleToggle = (e) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        onClick={handleToggle}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          backgroundColor: '#f7f7f7',
          borderRadius: 1,
          p: 1,
          cursor: 'pointer'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={handleToggle}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1 }}>
          {alerts.map((alert, idx) => (
            <AlertItem
              key={`${alert.symbol}-${idx}`}
              alert={alert}
              touched_side={touched_side}
              onViewDetails={onViewDetails} // Pass down
              isSmallScreen={isSmallScreen}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default GroupedAlerts;
