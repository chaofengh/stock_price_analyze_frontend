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
    ...(isDisabled && {
      color: theme.palette.text.disabled,
      borderColor: theme.palette.divider,
      backgroundColor: 'transparent',
    }),
  });

  return (
    <Box
      sx={{
        width: 56,
        height: '100%',
        py: 2,
        px: 1,
        borderRadius: (theme) => theme.shape.borderRadius,
        display: 'flex',
        justifyContent: 'flex-start',
        alignSelf: 'stretch',
        backgroundColor: 'background.header',
        backgroundImage: 'none',
        borderColor: 'divider',
        boxShadow: 'none',
        overflowY: 'auto',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Tooltip title="Financial Analysis" placement="right">
          <span>
            <IconButton
              aria-label="Financial analysis"
              aria-current={isAnalysisActive ? 'page' : undefined}
              size="small"
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
            size="small"
            component={RouterLink}
            to="/orb"
            sx={(theme) => baseIconStyles(theme, isOrbActive, false)}
          >
            <AutoGraphOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Watchlist (Coming Soon)" placement="right">
          <span>
            <IconButton
              aria-label="Watchlist"
              size="small"
              disabled
              sx={(theme) => baseIconStyles(theme, false, true)}
            >
              <BookmarkBorderOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Alerts (Coming Soon)" placement="right">
          <span>
            <IconButton
              aria-label="Alerts"
              size="small"
              disabled
              sx={(theme) => baseIconStyles(theme, false, true)}
            >
              <NotificationsNoneOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Settings (Coming Soon)" placement="right">
          <span>
            <IconButton
              aria-label="Settings"
              size="small"
              disabled
              sx={(theme) => baseIconStyles(theme, false, true)}
            >
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default SidebarRail;
