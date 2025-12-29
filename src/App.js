// App.js
import React, { useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  GlobalStyles,
} from '@mui/material';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link as RouterLink,
} from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { AlertsProvider } from './components/Notification/AlertContext';
import StockDashboard from './components/StockDashboard';
import SidebarRail from './components/SidebarRail/SidebarRail';
import UserProfileIcon from './components/UserProfileIcon';
import NotificationBell from './components/Notification/NotificationBell';
import AlertsSnackbar from './components/Notification/AlertsSnackbar';
import FinancialAnalysisPage from './components/statements/FinancialAnalysisPage';
import Backtest from './components/Backtest/Backtest';
import OptionPriceRatio from './components/SidebarRail/OptionPriceRatio';
import TickerList from './components/SidebarRail/TickerList';
import News from './components/SidebarRail/News';
import SymbolSearch from './components/SymbolSearch';

import { fetchSummary } from './components/Redux/summarySlice';
import theme from './theme';

function AppShell() {
  /* ───────── State & refs for slide‑out panels ───────── */
  const navHeight = 72;
  const railWidth = 176;

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.summary.data);
  const isDashboardRoute = location.pathname === '/';

  /* ───────── Symbol search handler ───────── */
  const handleSelectSymbol = (sym) => {
    const normalized = sym?.trim().toUpperCase();
    if (!normalized) return;
    navigate(`/?symbol=${encodeURIComponent(normalized)}`);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const rawSymbol = searchParams.get('symbol');
    const normalized = rawSymbol?.trim().toUpperCase();
    if (!normalized) return;
    if (summary?.symbol === normalized) return;
    dispatch(fetchSummary(normalized));
  }, [dispatch, location.search, summary?.symbol]);

  /* ───────── Gradient text style for the title ───────── */
  const gradientTitleStyle = {
    background: 'linear-gradient(90deg,#00E4FF 0%,#0098FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    MozBackgroundClip: 'text',
    textShadow: '0 0 8px rgba(0,184,255,0.45)',
    fontWeight: 700,
  };

  /* ───────── Render ───────── */
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          'html, body, #root': {
            height: '100%',
            margin: 0,
            padding: 0,
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            overscrollBehavior: 'none',
          },
        }}
      />
      <CssBaseline />
      <AlertsProvider>
        <AlertsSnackbar />

        {/* ================= HEADER ================= */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={(theme) => ({
            p: 0,
            top: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar + 1,
            backgroundColor: theme.palette.background.header,
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: theme.palette.background.header,
          })}
        >
          <Toolbar
            sx={{
              minHeight: navHeight,
              px: 0,
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              color: 'text.primary',
            }}
          >
            <Box
              sx={(theme) => ({
                width: railWidth,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                pl: 2.5,
                pr: 1.25,
              })}
            >
              <Typography
                component={RouterLink}
                to="/"
                variant="h6"
                sx={{
                  ...gradientTitleStyle,
                  fontSize: 18,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                noWrap
              >
                Lumina
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: { xs: 2, md: 3 },
              }}
            >
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 560 }}>
                  <SymbolSearch
                    placeholder="Search symbol…"
                    onSelectSymbol={handleSelectSymbol}
                    hideButton
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 1,
                  ml: 'auto',
                  flexShrink: 0,
                }}
              >
                <NotificationBell />
                <Box
                  sx={(theme) => ({
                    width: 2,
                    height: 28,
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                  })}
                />
                <UserProfileIcon />
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        <Toolbar sx={{ minHeight: navHeight }} />

        {/* ================ MAIN CONTENT ================ */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            height: `calc(100vh - ${navHeight}px)`,
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              height: '100%',
              minHeight: 0,
              flex: 1,
            }}
          >
            <SidebarRail summary={summary} railWidth={railWidth} />
            <Box
              sx={(theme) => ({
                flex: 1,
                minWidth: 0,
                height: '100%',
                minHeight: 0,
                py: isDashboardRoute ? 0 : { xs: 2, md: 3 },
                px: { xs: 2, md: 3 },
                overflow: isDashboardRoute ? 'hidden' : 'auto',
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
              <Routes>
                <Route path="/" element={<StockDashboard />} />
                <Route path="/analysis/:symbol" element={<FinancialAnalysisPage />} />
                <Route path="/option-price-ratio" element={<OptionPriceRatio />} />
                <Route path="/watchlist" element={<TickerList />} />
                <Route path="/news" element={<News />} />
                <Route path="/backtest" element={<Backtest />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </AlertsProvider>
    </ThemeProvider>
  );
}

/* Root wrapper so hooks (useNavigate) work */
export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
