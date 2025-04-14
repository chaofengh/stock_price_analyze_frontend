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
          background: 'linear-gradient(90deg, #e3f2fd, #ffffff)',
          borderRadius: 2,
          p: 1.5,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
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
              onViewDetails={onViewDetails}
              isSmallScreen={isSmallScreen}
              index={idx}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default GroupedAlerts;
