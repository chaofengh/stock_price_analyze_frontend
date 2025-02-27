import React, { useContext, useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { AlertsContext } from './AlertContext'

const AlertsSnackbar = () => {
  const { alerts, timestamp } = useContext(AlertsContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show the Snackbar if we get new alerts (non-empty array)
    if (alerts.length > 0) {
      setOpen(true);
    }
  }, [alerts]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar 
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity="info" sx={{ width: '100%' }}>
        {alerts.length} new alert(s) at {timestamp}
      </Alert>
    </Snackbar>
  );
};

export default AlertsSnackbar;
