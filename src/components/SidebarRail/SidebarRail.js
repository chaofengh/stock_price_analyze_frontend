import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Stack, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink, useLocation, matchPath } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePostHog } from 'posthog-js/react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ConfettiBurst from './ConfettiBurst';
import {
  CONFETTI_EXPERIMENT_FLAGS,
  captureFeatureFlagExposureWhenReady,
  getFeatureFlagVariant,
  shouldEnableConfetti,
} from '../../analytics/experiments';

const SidebarRail = ({ summary, railWidth = 176 }) => {
  const location = useLocation();
  const posthog = usePostHog();
  const isLoggedIn = useSelector((state) => Boolean(state?.auth?.accessToken));
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiBurstId, setConfettiBurstId] = useState(0);
  const confettiBurstIdRef = useRef(0);
  const pendingSignupExposureRef = useRef(null);

  const triggerConfetti = useCallback(() => {
    const nextId = confettiBurstIdRef.current + 1;
    confettiBurstIdRef.current = nextId;
    setConfettiBurstId(nextId);
    setConfettiActive(true);
    return nextId;
  }, []);

  useEffect(() => {
    if (!confettiActive) return;
    const timeout = setTimeout(() => setConfettiActive(false), 2200);
    return () => clearTimeout(timeout);
  }, [confettiActive]);

  useEffect(() => {
    const onRegistered = () => {
      const flagKey = CONFETTI_EXPERIMENT_FLAGS.signupSuccess;
      const flagValue = getFeatureFlagVariant(posthog, flagKey);
      const shouldShow = shouldEnableConfetti(flagValue);
      if (!shouldShow) {
        captureFeatureFlagExposureWhenReady(posthog, flagKey);
        return;
      }
      const burstId = triggerConfetti();
      pendingSignupExposureRef.current = { burstId, flagKey };
    };
    window.addEventListener('auth:registered', onRegistered);
    return () => window.removeEventListener('auth:registered', onRegistered);
  }, [posthog, triggerConfetti]);

  const handleSignupConfettiFired = useCallback(
    ({ burstId }) => {
      const pending = pendingSignupExposureRef.current;
      if (!pending || pending.burstId !== burstId) return;
      pendingSignupExposureRef.current = null;
      captureFeatureFlagExposureWhenReady(posthog, pending.flagKey);
    },
    [posthog]
  );

  const showConfettiTestButton =
    process.env.NODE_ENV !== 'production' ||
    String(process.env.REACT_APP_SHOW_CONFETTI_TEST || '').toLowerCase() === 'true';
  const searchParams = new URLSearchParams(location.search);
  const searchSymbol = searchParams.get('symbol')?.trim().toUpperCase() || '';
  const analysisMatch = matchPath('/analysis/:symbol', location.pathname);
  const analysisSymbol =
    summary?.symbol || analysisMatch?.params?.symbol || searchSymbol || '';
  const hasSymbol = Boolean(analysisSymbol);
  const isAnalysisActive = Boolean(analysisMatch);
  const isOptionRatioActive = location.pathname === '/option-price-ratio';
  const isWatchListActive = location.pathname === '/watchlist';
  const isNewsActive = location.pathname === '/news';
  const isBacktestActive = location.pathname === '/backtest';
  const isDashboardActive = location.pathname === '/' && Boolean(analysisSymbol);
  const dashboardLink = analysisSymbol
    ? `/?symbol=${encodeURIComponent(analysisSymbol)}`
    : '/';
  const analysisLinkProps = hasSymbol
    ? {
        component: RouterLink,
        to: `/analysis/${analysisSymbol}`,
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
      borderRadius: 'var(--app-radius)',
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
      <ConfettiBurst
        active={confettiActive}
        burstId={confettiBurstId}
        variant="signup"
        onFired={handleSignupConfettiFired}
      />
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
          aria-label="Option price ratio"
          aria-current={isOptionRatioActive ? 'page' : undefined}
          component={RouterLink}
          to="/option-price-ratio"
          disableGutters
          sx={(theme) => baseItemStyles(theme, isOptionRatioActive)}
        >
          <ListItemIcon>
            <SwapHorizOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Option Price Ratio" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>

        <ListItemButton
          aria-label="Watch list"
          aria-current={isWatchListActive ? 'page' : undefined}
          component={RouterLink}
          to="/watchlist"
          state={{ source: 'nav' }}
          disableGutters
          sx={(theme) => baseItemStyles(theme, isWatchListActive)}
        >
          <ListItemIcon>
            <BookmarkBorderOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Watch List"
            primaryTypographyProps={{ noWrap: true }}
            sx={(theme) => ({
              minWidth: 0,
              position: 'relative',
              ...(isLoggedIn
                ? null
                : {
                    isolation: 'isolate',
                    '@keyframes watchlistMistBreathe': {
                      '0%, 100%': {
                        opacity: 0.45,
                        transform: 'translateY(0px) translateX(0px) scale(1)',
                      },
                      '50%': {
                        opacity: 0.85,
                        transform: 'translateY(-0.6px) translateX(0.6px) scale(1.05)',
                      },
                    },
                    '@keyframes watchlistSparkleFlicker': {
                      '0%, 100%': { opacity: 0.18 },
                      '50%': { opacity: 0.65 },
                    },
                    '@keyframes watchlistTextBreathe': {
                      '0%, 100%': { opacity: 0.82 },
                      '50%': { opacity: 1 },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -18,
                      right: -14,
                      top: -14,
                      bottom: -14,
                      pointerEvents: 'none',
                      background: `
                        radial-gradient(130px 46px at 52% 58%, ${alpha('#F2C96D', 0.24)}, transparent 68%),
                        radial-gradient(62px 24px at 34% 52%, ${alpha('#F2C96D', 0.42)}, transparent 72%),
                        radial-gradient(64px 24px at 74% 64%, ${alpha('#F2C96D', 0.34)}, transparent 72%),
                        radial-gradient(40px 20px at 18% 58%, ${alpha('#F2C96D', 0.22)}, transparent 74%),
                        radial-gradient(42px 20px at 88% 46%, ${alpha('#F2C96D', 0.2)}, transparent 74%)
                      `,
                      filter: 'blur(14px)',
                      opacity: 0.7,
                      zIndex: 0,
                      animation: 'watchlistMistBreathe 2.8s ease-in-out infinite',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: -10,
                      right: -8,
                      top: -10,
                      bottom: -10,
                      pointerEvents: 'none',
                      background: `
                        radial-gradient(2px 2px at 22% 46%, ${alpha('#FFF2C0', 0.9)} 0%, transparent 65%),
                        radial-gradient(2px 2px at 32% 68%, ${alpha('#FFF2C0', 0.8)} 0%, transparent 65%),
                        radial-gradient(2px 2px at 54% 44%, ${alpha('#FFF2C0', 0.9)} 0%, transparent 65%),
                        radial-gradient(2px 2px at 72% 64%, ${alpha('#FFF2C0', 0.75)} 0%, transparent 65%),
                        radial-gradient(2px 2px at 86% 48%, ${alpha('#FFF2C0', 0.9)} 0%, transparent 65%)
                      `,
                      filter: 'blur(0.2px)',
                      opacity: 0.55,
                      zIndex: 0,
                      animation: 'watchlistSparkleFlicker 3.4s ease-in-out infinite',
                    },
                    '& .MuiListItemText-primary': {
                      position: 'relative',
                      zIndex: 1,
                      color: alpha('#F2C96D', 0.9),
                      textShadow: `0 0 14px ${alpha('#F2C96D', 0.22)}`,
                      animation: 'watchlistTextBreathe 2.8s ease-in-out infinite',
                    },
                  }),
            })}
          />
        </ListItemButton>

        <ListItemButton
          aria-label="News"
          aria-current={isNewsActive ? 'page' : undefined}
          component={RouterLink}
          to="/news"
          disableGutters
          sx={(theme) => baseItemStyles(theme, isNewsActive)}
        >
          <ListItemIcon>
            <ArticleOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="News" primaryTypographyProps={{ noWrap: true }} />
        </ListItemButton>

        <ListItemButton
          aria-label="Backtest"
          aria-current={isBacktestActive ? 'page' : undefined}
          component={RouterLink}
          to="/backtest"
          disableGutters
          sx={(theme) => baseItemStyles(theme, isBacktestActive)}
        >
          <ListItemIcon>
            <AutoGraphOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="BackTest" primaryTypographyProps={{ noWrap: true }} />
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

        {showConfettiTestButton && (
          <ListItemButton
            aria-label="Trigger confetti effect"
            onClick={triggerConfetti}
            disableGutters
            sx={(theme) => baseItemStyles(theme, false)}
          >
            <ListItemIcon>
              <AutoAwesomeRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Confetti Test" primaryTypographyProps={{ noWrap: true }} />
          </ListItemButton>
        )}
      </Stack>
    </Box>
  );
};

export default SidebarRail;
