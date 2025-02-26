import React, { useState, useContext } from 'react';
import { IconButton, Badge, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Typography, Box } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { AlertsContext } from './AlertContext';

const NotificationBell = () => {
  const { alerts, timestamp } = useContext(AlertsContext);
  const [open, setOpen] = useState(false);

  const alertCount = alerts.length;

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Bell Icon with Badge */}
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={alertCount} color="secondary">
          <Notifications />
        </Badge>
      </IconButton>

      {/* Modal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {alertCount > 0 
            ? `Alerts (Updated at ${timestamp})` 
            : 'No current alerts'}
        </DialogTitle>
        <DialogContent dividers>
          {alertCount > 0 && (
            <List>
              {alerts.map((alert, idx) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {alert.symbol}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2, color: alert.touched_side === 'Upper' ? 'red' : 'green' }}>
                          {alert.touched_side === 'Upper' ? 'Touched Upper Band' : 'Touched Lower Band'}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Close Price: {alert.close_price} | BB Upper: {alert.bb_upper} | BB Lower: {alert.bb_lower}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationBell;
