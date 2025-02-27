// NotificationBell.jsx

import React, { useState, useContext, useMemo } from 'react';
import {
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery
} from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { AlertsContext } from './AlertContext';
import { useTheme } from '@mui/system';
import { useDispatch } from 'react-redux';
import { fetchSummary } from '../Redux/summarySlice';
import GroupedAlerts from './GroupedAlerts';

const NotificationBell = () => {
  const { alerts, timestamp, clearAlerts } = useContext(AlertsContext);
  const [open, setOpen] = useState(false);
  const [sortOption, setSortOption] = useState('symbol');

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();

  const alertCount = alerts.length;

  // Sort & group
  const groupedAlerts = useMemo(() => {
    const sorted = [...alerts];
    if (sortOption === 'symbol') {
      sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
    } else if (sortOption === 'side') {
      // a.bandSide => 'Upper' or 'Lower'
      sorted.sort((a, b) => a.bandSide.localeCompare(b.bandSide));
    }

    // Group by bandSide => { Upper: [...], Lower: [...] }
    const map = { Upper: [], Lower: [] };
    for (const alert of sorted) {
      if (alert.bandSide === 'Upper') {
        map.Upper.push(alert);
      } else {
        map.Lower.push(alert);
      }
    }
    return map;
  }, [alerts, sortOption]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleMarkAsRead = () => {
    clearAlerts();
    handleClose();
  };

  // 1) Helper function that calls fetchSummary, then closes the dialog
  const handleViewDetailsAndClose = (symbol) => {
    dispatch(fetchSummary(symbol));
    handleClose(); // closes the dialog
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={alertCount} color="secondary">
          <Notifications />
        </Badge>
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {alertCount > 0 ? 'Daily Bollinger Alerts' : 'No Current Alerts'}
        </DialogTitle>

        {alertCount > 0 && (
          <Typography variant="subtitle2" sx={{ ml: 3, mt: -1, color: 'text.secondary' }}>
            Updated at {timestamp}
          </Typography>
        )}

        <DialogContent dividers>
          {alertCount > 0 && (
            <Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ width: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortOption}
                  label="Sort by"
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <MenuItem value="symbol">Symbol</MenuItem>
                  <MenuItem value="side">Upper/Lower</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {alertCount > 0 ? (
            <>
              {/* Group: Upper */}
              {groupedAlerts.Upper.length > 0 && (
                <GroupedAlerts
                  title={`${
                    groupedAlerts.Upper.length
                  } Stocks Crossed Above the Upper Bollinger Band`}
                  alerts={groupedAlerts.Upper}
                  onViewDetails={handleViewDetailsAndClose} // pass our function here
                  isSmallScreen={isSmallScreen}
                  bandSide="Upper"
                />
              )}

              {/* Group: Lower */}
              {groupedAlerts.Lower.length > 0 && (
                <GroupedAlerts
                  title={`${
                    groupedAlerts.Lower.length
                  } Stocks Crossed Below the Lower Bollinger Band`}
                  alerts={groupedAlerts.Lower}
                  onViewDetails={handleViewDetailsAndClose} // pass our function here
                  isSmallScreen={isSmallScreen}
                  bandSide="Lower"
                />
              )}
            </>
          ) : (
            <Typography variant="body1">
              You are all caught up! No Bollinger crossings detected.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between' }}>
          {alertCount > 0 && (
            <Button
              onClick={handleMarkAsRead}
              variant="contained"
              color="primary"
            >
              Mark All as Read
            </Button>
          )}
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationBell;
