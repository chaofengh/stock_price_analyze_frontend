import React from 'react';
import { Box, Stack, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink, useLocation, matchPath } from 'react-router-dom';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const SidebarRail = ({ summary }) => {
  const location = useLocation();
  const analysisMatch = matchPath('/analysis/:symbol', location.pathname);
  const analysisSymbol = summary?.symbol || analysisMatch?.params?.symbol || '';
  const hasSymbol = Boolean(analysisSymbol);
  const isAnalysisActive = Boolean(analysisMatch);
  const isOrbActive = location.pathname.startsWith('/orb');
  const analysisLinkProps = hasSymbol
    ? {
        component: RouterLink,
        to: `/analysis/${analysisSymbol}`,
        state: summary?.income_statement
          ? { income_statement: summary.income_statement }
          : undefined,
      }
    : {};

  const baseIconStyles = (theme, isActive, isDisabled) => ({
    width: 40,
    height: 40,
    borderRadius: 2,
    border: '1px solid',
    borderColor: isActive ? theme.palette.primary.main : theme.palette.divider,
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: isActive
      ? alpha(theme.palette.primary.main, 0.14)
      : 'transparent',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      color: theme.palette.primary.main,
    },
    '& svg': {
      fontSize: 28,
    },
    ...(isDisabled && {
      color: theme.palette.text.disabled,
      borderColor: theme.palette.divider,
      backgroundColor: 'transparent',
    }),
  });

  return (
    <Box
      sx={(theme) => ({
        width: 56,
        height: '100%',
        minHeight: 0,
        py: 2,
        px: 1,
        borderRadius: `${theme.shape.borderRadius}px`,
        display: 'flex',
        justifyContent: 'flex-start',
        alignSelf: 'stretch',
        backgroundColor: theme.palette.background.header,
        backgroundImage: 'none',
        borderColor: theme.palette.divider,
        boxShadow: 'none',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: `${alpha(theme.palette.primary.main, 0.5)} ${alpha(
          theme.palette.background.header,
          0.35
        )}`,
        '&::-webkit-scrollbar': {
          width: 8,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: alpha(theme.palette.background.header, 0.4),
          borderRadius: 999,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.text.primary, 0.28),
          borderRadius: 999,
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.7),
        },
      })}
    >
      <Stack spacing={2.5} alignItems="center">
        <Tooltip title="Financial Analysis" placement="right">
          <span>
            <IconButton
              aria-label="Financial analysis"
              aria-current={isAnalysisActive ? 'page' : undefined}
              size="medium"
              disabled={!hasSymbol}
              {...analysisLinkProps}
              sx={(theme) => ({
                ...baseIconStyles(theme, isAnalysisActive, !hasSymbol),
                '&.Mui-disabled': {
                  color: theme.palette.text.disabled,
                  borderColor: theme.palette.divider,
                },
              })}
            >
              <AssessmentOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Opening Range Breakout" placement="right">
          <IconButton
            aria-label="Opening range breakout"
            aria-current={isOrbActive ? 'page' : undefined}
            size="medium"
            component={RouterLink}
            to="/orb"
            sx={(theme) => baseIconStyles(theme, isOrbActive, false)}
          >
            <AutoGraphOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Watchlist (Coming Soon)" placement="right">
          <span>
            <IconButton
              aria-label="Watchlist"
              size="medium"
              disabled
              sx={(theme) => baseIconStyles(theme, false, true)}
            >
              <BookmarkBorderOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Alerts (Coming Soon)" placement="right">
          <span>
            <IconButton
              aria-label="Alerts"
              size="medium"
              disabled
              sx={(theme) => baseIconStyles(theme, false, true)}
            >
              <NotificationsNoneOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Settings (Coming Soon)" placement="right">
          <span>
            <IconButton
              aria-label="Settings"
              size="medium"
              disabled
              sx={(theme) => baseIconStyles(theme, false, true)}
            >
              <SettingsOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default SidebarRail;
