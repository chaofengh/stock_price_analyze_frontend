// src/components/NotificationBell.js
import React, { useState, useContext, useMemo } from 'react';
import {
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery
} from '@mui/material';
import { Notifications, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { AlertsContext } from './AlertContext';
import { useTheme } from '@mui/system';

// Helper function to format prices
const formatPrice = (price) => (typeof price === 'number' ? price.toFixed(2) : price);

const NotificationBell = () => {
  const { alerts, timestamp, clearAlerts } = useContext(AlertsContext);
  const [open, setOpen] = useState(false);
  const [sortOption, setSortOption] = useState('symbol');

  const theme = useTheme();
  // Check if current screen is "small" or below
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const alertCount = alerts.length;

  // Sort alerts based on the chosen sortOption
  const sortedAlerts = useMemo(() => {
    const newArr = [...alerts];
    if (sortOption === 'symbol') {
      // Alphabetical by symbol
      newArr.sort((a, b) => a.symbol.localeCompare(b.symbol));
    } else if (sortOption === 'side') {
      // Group Upper first, then Lower (alphabetical)
      newArr.sort((a, b) => a.touched_side.localeCompare(b.touched_side));
    }
    return newArr;
  }, [alerts, sortOption]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Mark all as read: calls clearAlerts from context
  const handleMarkAsRead = () => {
    clearAlerts();
    handleClose();
  };

  return (
    <>
      {/* Bell Icon with Badge */}
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={alertCount} color="secondary">
          <Notifications />
        </Badge>
      </IconButton>

      {/* Modal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {alertCount > 0 ? 'Daily Bollinger Alerts' : 'No Current Alerts'}
        </DialogTitle>

        {alertCount > 0 && (
          <Typography
            variant="subtitle2"
            sx={{ ml: 3, mt: -1, color: 'text.secondary' }}
          >
            Updated at {timestamp}
          </Typography>
        )}

        <DialogContent dividers>
          {alertCount > 0 && (
            <>
              {/* Sorting Options */}
              <Box display="flex" justifyContent="flex-end" sx={{ mb: 2 }}>
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

              {/* List of Alerts */}
              <List>
                {sortedAlerts.map((alert, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem alignItems="flex-start" disableGutters>
                      <ListItemText
                        primary={
                          <Box
                            display="flex"
                            alignItems="center"
                            // Adjust typography for small vs. large screens
                            sx={{
                              typography: {
                                sm: 'subtitle1',
                                xs: 'subtitle2'
                              },
                              fontWeight: 700
                            }}
                          >
                            {/* Symbol */}
                            {alert.symbol}

                            {/* Chip: Touched Upper/Lower */}
                            <Chip
                              label={
                                alert.touched_side === 'Upper'
                                  ? 'Touched Upper'
                                  : 'Touched Lower'
                              }
                              size="small"
                              icon={
                                alert.touched_side === 'Upper' ? (
                                  <ArrowUpward
                                    sx={{ color: '#c62828 !important' }}
                                  />
                                ) : (
                                  <ArrowDownward
                                    sx={{ color: '#2e7d32 !important' }}
                                  />
                                )
                              }
                              sx={{
                                ml: 2,
                                backgroundColor:
                                  alert.touched_side === 'Upper'
                                    ? '#ffebee'
                                    : '#e8f5e9',
                                color:
                                  alert.touched_side === 'Upper'
                                    ? '#c62828'
                                    : '#2e7d32',
                                fontWeight: 500
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Grid container spacing={1} sx={{ mt: 0.5 }}>
                            <Grid item xs={12}>
                              <Typography
                                variant={isSmallScreen ? 'body2' : 'body1'}
                                component="span"
                              >
                                <strong>Close Price:</strong> {formatPrice(alert.close_price)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography
                                variant={isSmallScreen ? 'body2' : 'body1'}
                                component="span"
                              >
                                <strong>BB Upper:</strong> {formatPrice(alert.bb_upper)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography
                                variant={isSmallScreen ? 'body2' : 'body1'}
                                component="span"
                              >
                                <strong>BB Lower:</strong> {formatPrice(alert.bb_lower)}
                              </Typography>
                            </Grid>
                          </Grid>
                        }
                      />

                      {/* Optional Button to view details */}
                      <Box sx={{ ml: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            console.log(`View details for ${alert.symbol}`);
                            // e.g., navigate(`/stocks/${alert.symbol}`)
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </ListItem>

                    {idx < sortedAlerts.length - 1 && (
                      <Divider sx={{ my: 1 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}

          {alertCount === 0 && (
            <Typography variant="body1">
              You are all caught up! No Bollinger band touches detected.
            </Typography>
          )}
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions>
          {alertCount > 0 && (
            <Button onClick={handleMarkAsRead} color="warning">
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
