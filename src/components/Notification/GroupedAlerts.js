// GroupedAlerts.js
import React, { useState } from 'react';
import {
  Typography,
  Box,
  IconButton,
  Collapse,
  Chip,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import AlertItem from './AlertItem';

const GroupedAlerts = ({
  title,
  alerts,
  onViewDetails,
  isSmallScreen,
  touched_side,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);

  const handleToggle = (e) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  // Use theme colors you added: band.overbought / band.oversold + readable header colors
  const accent =
    touched_side === 'Upper'
      ? theme.palette.band?.overbought || theme.palette.error.main
      : theme.palette.band?.oversold || theme.palette.success.main;

  const headerTextColor =
    touched_side === 'Upper'
      ? theme.palette.band?.headerUpper || theme.palette.text.primary
      : theme.palette.band?.headerLower || theme.palette.text.primary;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header row */}
      <Box
        onClick={handleToggle}
        role="button"
        aria-expanded={open}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          position: 'relative',
          cursor: 'pointer',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          // subtle surface with just a hint of tint so text has contrast
          backgroundColor: alpha('#000', 0.25),
          px: 2,
          py: 1.25,
          transition: 'border-color 160ms ease, background-color 160ms ease',
          '&:hover': {
            borderColor: alpha(accent, 0.7),
            backgroundColor: alpha(accent, 0.08),
          },
          // left accent bar
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            background: accent,
            boxShadow: `0 0 10px ${alpha(accent, 0.45)}`,
          },
        }}
      >
        <Typography
          variant={isSmallScreen ? 'subtitle1' : 'h6'}
          sx={{
            fontWeight: 700,
            color: headerTextColor,
            pr: 2,
            lineHeight: 1.25,
            // keep long titles readable on narrow screens
            wordBreak: 'break-word',
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Chip
            size="small"
            label={`${alerts.length}`}
            variant="outlined"
            sx={{
              fontWeight: 700,
              color: headerTextColor,
              borderColor: alpha(accent, 0.6),
              bgcolor: alpha(accent, 0.12),
            }}
          />
          <IconButton
            size="small"
            onClick={handleToggle}
            sx={{
              color: headerTextColor,
              '&:hover': { color: alpha(headerTextColor, 0.85) },
            }}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* List */}
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
