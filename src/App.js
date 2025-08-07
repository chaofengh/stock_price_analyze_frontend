// App.js
import React, { useState, useRef, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
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
} from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AlertsProvider } from './components/Notification/AlertContext';
import StockDashboard from './components/StockDashboard';
import UserProfileIcon from './components/UserProfileIcon';
import NotificationBell from './components/Notification/NotificationBell';
import MoreOptionsMenu from './components/MoreOption/MoreOptionsMenu';
import AlertsSnackbar from './components/Notification/AlertsSnackbar';
import OptionPriceRatio from './components/MoreOption/OptionPriceRatio';
import TickerList from './components/MoreOption/TickerList';
import FinancialAnalysisPage from './components/statements/FinancialAnalysisPage';
import Backtest from './components/Backtest/Backtest';
import News from './components/MoreOption/News';
import SymbolSearch from './components/SymbolSearch';

import { fetchSummary } from './components/Redux/summarySlice';
import theme from './theme';

function AppShell() {
  /* ───────── State & refs for slide‑out panels ───────── */
  const [selectedView, setSelectedView] = useState(null);
  const tickerListRef = useRef(null);
  const ratioRef = useRef(null);
  const newsRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  /* ───────── Symbol search handler ───────── */
  const handleSelectSymbol = (sym) => {
    if (!sym) return;
    dispatch(fetchSummary(sym));
    navigate('/'); // stay on the dashboard
  };

  /* ───────── Click‑outside logic (unchanged) ───────── */
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        selectedView === 'WatchList' &&
        tickerListRef.current &&
        !tickerListRef.current.contains(e.target)
      ) {
        const gridMenu = document.querySelector('.MuiDataGrid-menu');
        if (gridMenu && gridMenu.contains(e.target)) return;
        setSelectedView(null);
      }
      if (
        selectedView === 'OptionPriceRatio' &&
        ratioRef.current &&
        !ratioRef.current.contains(e.target)
      ) {
        setSelectedView(null);
      }
      if (
        selectedView === 'News' &&
        newsRef.current &&
        !newsRef.current.contains(e.target)
      ) {
        setSelectedView(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedView]);

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
          },
        }}
      />
      <CssBaseline />
      <AlertsProvider>
        <AlertsSnackbar />

        {/* ================= HEADER ================= */}
        <AppBar
          position="static"
          elevation={4}
          sx={{
            p:0,
            backgroundColor: theme.palette.background.header,
            boxShadow: '0 0 12px rgba(0,184,255,0.25)',
          }}
        >
          <Toolbar
            sx={{ minHeight: 80, gap: 3, display: 'flex',}}>
            {/* Left: Title */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={gradientTitleStyle}>
                Lumina
              </Typography>
            </Box>

            {/* Center: Search bar (with search button removed via new prop) */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center'}}>
              <SymbolSearch
                placeholder="Search symbol…"
                onSelectSymbol={handleSelectSymbol}
                hideButton
              />
            </Box>

            {/* Right: Icons */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
              <UserProfileIcon />
              <NotificationBell />
              <MoreOptionsMenu onSelectView={setSelectedView} />
            </Box>
          </Toolbar>
        </AppBar>

        {/* ================ MAIN CONTENT ================ */}
        <Container
          maxWidth="xl"
          sx={{ mt: 4, mb: 4, position: 'relative', minHeight: 600 }}
        >
          <Routes>
            <Route path="/" element={<StockDashboard />} />
            <Route path="/analysis/:symbol" element={<FinancialAnalysisPage />} />
            <Route path="/backtest" element={<Backtest />} />
          </Routes>

          {/* Pop‑over side panels (unchanged) */}
          {selectedView === 'WatchList' && (
            <Box
              ref={tickerListRef}
              sx={{ position: 'absolute', top: 0, right: -150, zIndex: 10, maxHeight: '90vh', overflowY: 'auto', width: 400 }}
            >
              <TickerList />
            </Box>
          )}
          {selectedView === 'OptionPriceRatio' && (
            <Box
              ref={ratioRef}
              sx={{ position: 'absolute', top: 0, right: -150, zIndex: 10, maxHeight: '90vh', overflowY: 'auto', width: 400 }}
            >
              <OptionPriceRatio />
            </Box>
          )}
          {selectedView === 'News' && (
            <Box
              ref={newsRef}
              sx={{ position: 'absolute', top: 0, right: -150, zIndex: 10, maxHeight: '90vh', overflowY: 'auto', width: 400 }}
            >
              <News />
            </Box>
          )}
        </Container>
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
