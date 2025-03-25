import React, { useContext, useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { AlertsContext } from './AlertContext';

const AlertsSnackbar = () => {
  const { alerts, timestamp } = useContext(AlertsContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show the Snackbar if there is at least one alert.
    if (alerts.length > 0) {
      setOpen(true);
    }
  }, [alerts]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  // Assume each alert is an object with { message, severity }.
  // We'll display the first alert in the array.
  const firstAlert = alerts[0] || { message: '', severity: 'info' };

  return (
    <Snackbar 
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={firstAlert.severity} sx={{ width: '100%' }}>
        {firstAlert.message} {timestamp && `at ${timestamp}`}
      </Alert>
    </Snackbar>
  );
};

export default AlertsSnackbar;
