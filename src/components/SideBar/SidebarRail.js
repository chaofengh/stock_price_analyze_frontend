import React from 'react';
import { Box, Stack, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink, useLocation, matchPath } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const SidebarRail = ({ summary, railWidth = 176 }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchSymbol = searchParams.get('symbol')?.trim().toUpperCase() || '';
  const analysisMatch = matchPath('/analysis/:symbol', location.pathname);
  const analysisSymbol =
    summary?.symbol || analysisMatch?.params?.symbol || searchSymbol || '';
  const hasSymbol = Boolean(analysisSymbol);
  const isAnalysisActive = Boolean(analysisMatch);
  const isOrbActive = location.pathname.startsWith('/orb');
  const isDashboardActive = location.pathname === '/' && Boolean(analysisSymbol);
  const dashboardLink = analysisSymbol
    ? `/?symbol=${encodeURIComponent(analysisSymbol)}`
    : '/';
  const analysisLinkProps = hasSymbol
    ? {
        component: RouterLink,
        to: `/analysis/${analysisSymbol}`,
        state: summary?.income_statement
          ? { income_statement: summary.income_statement }
          : undefined,
      }
    : {};

  const baseItemStyles = (theme, isActive) => ({
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 1.25,
    pl: 2.5,
    pr: 1.25,
    py: 2,
    minHeight: 40,
    border: '1px solid transparent',
    borderColor: isActive ? alpha(theme.palette.common.white, 0.12) : 'transparent',
    color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
    backgroundColor: isActive
      ? alpha(theme.palette.common.white, 0.08)
      : 'transparent',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 3,
      bottom: 3,
      width: 3,
      borderRadius: 2,
      backgroundColor: alpha(theme.palette.common.white, 0.85),
      opacity: isActive ? 1 : 0,
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.06),
      color: theme.palette.text.primary,
    },
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      color: 'inherit',
    },
    '& .MuiListItemText-root': {
      margin: 0,
    },
    '& .MuiListItemText-primary': {
      fontSize: 12,
      fontWeight: isActive ? 600 : 500,
      letterSpacing: 0.1,
      lineHeight: 1.2,
      color: 'inherit',
    },
    '& svg': {
      fontSize: 19,
    },
    '&.Mui-disabled': {
      color: theme.palette.text.disabled,
      backgroundColor: 'transparent',
      opacity: 1,
    },
  });

  return (
    <Box
      sx={(theme) => ({
        width: railWidth,
        height: '100%',
        minHeight: 0,
        pt: 3,
        pb: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        alignSelf: 'stretch',
        backgroundColor: theme.palette.background.header,
        backgroundImage: 'none',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehaviorY: 'contain',
        overscrollBehaviorX: 'none',
        WebkitOverflowScrolling: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: `${alpha(theme.palette.primary.main, 0.5)} ${alpha(
          theme.palette.background.header,
          0.35
        )}`,
        '&::-webkit-scrollbar': {
          width: 8,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: alpha(theme.palette.background.header, 0.4)
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.text.primary, 0.28),
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.7),
        },
      })}
    >
      <Stack spacing={0.25} width="100%" sx={{ flexGrow: 0 }}>
        <ListItemButton
          aria-label="Dashboard"
          aria-current={isDashboardActive ? 'page' : undefined}
          component={RouterLink}
          to={dashboardLink}
          disableGutters
          sx={(theme) => baseItemStyles(theme, isDashboardActive)}
        >
          <ListItemIcon>
            <DashboardOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>

        <ListItemButton
          aria-label="Financial analysis"
          aria-current={isAnalysisActive ? 'page' : undefined}
          disabled={!hasSymbol}
          {...analysisLinkProps}
          disableGutters
          sx={(theme) => baseItemStyles(theme, isAnalysisActive)}
        >
          <ListItemIcon>
            <AssessmentOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Financial Analysis"
            primaryTypographyProps={{ noWrap: true }}
          />
        </ListItemButton>

        <ListItemButton
          aria-label="Opening range breakout"
          aria-current={isOrbActive ? 'page' : undefined}
          component={RouterLink}
          to="/orb"
          disableGutters
          sx={(theme) => baseItemStyles(theme, isOrbActive)}
        >
          <ListItemIcon>
            <AutoGraphOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="ORB Strategy" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>

        <ListItemButton
          aria-label="Watchlist"
          disabled
          disableGutters
          sx={(theme) => baseItemStyles(theme, false)}
        >
          <ListItemIcon>
            <BookmarkBorderOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Watchlist" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>

        <ListItemButton
          aria-label="Alerts"
          disabled
          disableGutters
          sx={(theme) => baseItemStyles(theme, false)}
        >
          <ListItemIcon>
            <NotificationsNoneOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Alerts" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>

        <ListItemButton
          aria-label="Settings"
          disabled
          disableGutters
          sx={(theme) => baseItemStyles(theme, false)}
        >
          <ListItemIcon>
            <SettingsOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>
      </Stack>
    </Box>
  );
};

export default SidebarRail;
