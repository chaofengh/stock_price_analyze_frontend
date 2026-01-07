import React, { useState, useContext, useMemo } from 'react';
import {
  Button, Badge, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, FormControl, InputLabel, Select, MenuItem,
  useMediaQuery, Slide
} from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { AlertsContext } from './AlertContext';
import { useTheme } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import GroupedAlerts from './GroupedAlerts';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const NotificationBell = () => {
  const { alerts, timestamp, clearAlerts } = useContext(AlertsContext);
  const [open, setOpen] = useState(false);
  const [sortOption, setSortOption] = useState('symbol');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const alertCount = alerts.length;

  const groupedAlerts = useMemo(() => {
    const sorted = [...alerts];
    if (sortOption === 'symbol') sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
    else if (sortOption === 'side') sorted.sort((a, b) => a.touched_side.localeCompare(b.touched_side));

    const map = { Upper: [], Lower: [] };
    for (const a of sorted) (a.touched_side === 'Upper' ? map.Upper : map.Lower).push(a);
    return map;
  }, [alerts, sortOption]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleMarkAsRead = () => { clearAlerts(); handleClose(); };
  const handleViewDetailsAndClose = (symbol) => {
    const normalized = symbol?.trim().toUpperCase();
    if (!normalized) return;
    navigate(`/?symbol=${encodeURIComponent(normalized)}`);
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        disableElevation
        disableRipple
        onClick={handleOpen}
        sx={{
          boxShadow: 'none',
          minWidth: 36,
          width: 36,
          height: 36,
          p: 0,
          borderRadius: 8,
          transition: 'background-color 150ms ease',
          '&:hover': { boxShadow: 'none' }
        }}
      >
        <Badge
          badgeContent={alertCount}
          color="secondary"
          sx={{
            '& .MuiBadge-badge': {
              top: 2,
              right: 2,
            },
          }}
        >
          <Notifications sx={{ fontSize: 22 }} />
        </Badge>
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth TransitionComponent={Transition}>
        <DialogTitle
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
            color: '#fff',
            p: 2,
          }}
        >
          {alertCount > 0 ? 'Daily Bollinger Alerts' : 'No Current Alerts'}
        </DialogTitle>

        {alertCount > 0 && (
          <Typography variant="subtitle2" sx={{ ml: 3, mt: 1, color: 'text.secondaryBright' }}>
            Updated at {timestamp}
          </Typography>
        )}

        {/* Use themed dark paper background for readability */}
        <DialogContent dividers sx={{ backgroundColor: 'background.paper' }}>
          {alertCount > 0 && (
            <Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ width: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select value={sortOption} label="Sort by" onChange={(e) => setSortOption(e.target.value)}>
                  <MenuItem value="symbol">Symbol</MenuItem>
                  <MenuItem value="side">Upper/Lower</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {alertCount > 0 ? (
            <>
              {groupedAlerts.Upper.length > 0 && (
                <GroupedAlerts
                  title={`${groupedAlerts.Upper.length} Stocks Crossed Above the Upper Bollinger Band`}
                  alerts={groupedAlerts.Upper}
                  onViewDetails={handleViewDetailsAndClose}
                  isSmallScreen={isSmallScreen}
                  touched_side="Upper" // GroupedAlerts can color this header with theme.palette.band.headerUpper
                />
              )}
              {groupedAlerts.Lower.length > 0 && (
                <GroupedAlerts
                  title={`${groupedAlerts.Lower.length} Stocks Crossed Below the Lower Bollinger Band`}
                  alerts={groupedAlerts.Lower}
                  onViewDetails={handleViewDetailsAndClose}
                  isSmallScreen={isSmallScreen}
                  touched_side="Lower" // GroupedAlerts can color this header with theme.palette.band.headerLower
                />
              )}
            </>
          ) : (
            <Typography variant="body1">
              You are all caught up! No Bollinger crossings detected.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          {alertCount > 0 && (
            <Button
              onClick={handleMarkAsRead}
              variant="contained"
              color="primary"
              sx={{
                textTransform: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                ':hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.25)' },
              }}
            >
              Mark All as Read
            </Button>
          )}
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationBell;
