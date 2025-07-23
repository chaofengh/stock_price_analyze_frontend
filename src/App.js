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
  useTheme
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AlertsProvider } from './components/Notification/AlertContext';
import StockDashboard from './components/StockDashboard';
import UserProfileIcon from './components/UserProfileIcon';
import NotificationBell from './components/Notification/NotificationBell';
import MoreOptionsMenu from './components/MoreOption/MoreOptionsMenu';
import AlertsSnackbar from './components/Notification/AlertsSnackbar';
import OptionPriceRatio from './components/MoreOption/OptionPriceRatio';
import TickerList from './components/MoreOption/TickerList';
import FinancialAnalysisPage from './components/statements/FinancialAnalysisPage';

// Renamed:
import Backtest from './components/Backtest/Backtest'; 
// Replaces old OpeningRangeBreakout

import News from './components/MoreOption/News';

// Import the centralized dark gaming theme
import theme from './theme';

function App() {
  const [selectedView, setSelectedView] = useState(null);

  // Refs for detecting outside clicks
  const tickerListRef = useRef(null);
  const ratioRef = useRef(null);
  const newsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        selectedView === 'WatchList' &&
        tickerListRef.current &&
        !tickerListRef.current.contains(event.target)
      ) {
        const dataGridMenuEl = document.querySelector('.MuiDataGrid-menu');
        if (dataGridMenuEl && dataGridMenuEl.contains(event.target)) {
          return;
        }
        setSelectedView(null);
      }
      if (
        selectedView === 'OptionPriceRatio' &&
        ratioRef.current &&
        !ratioRef.current.contains(event.target)
      ) {
        setSelectedView(null);
      }
      if (
        selectedView === 'News' &&
        newsRef.current &&
        !newsRef.current.contains(event.target)
      ) {
        setSelectedView(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedView]);

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <GlobalStyles
          styles={{
            'html, body, #root': {
              height: '100%',
              margin: 0,
              padding: 0,
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
            }
          }}
        />
        <CssBaseline />
        <AlertsProvider>
          <AlertsSnackbar />

          <AppBar
            position="static"
            elevation={4}
            sx={{
              backgroundColor: theme.palette.background.header,
              boxShadow: '0 0 12px rgba(0,184,255,0.25)',
            }}
          >
            <Toolbar sx={{ minHeight: 64 }}>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                Lumina Stock Insights
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserProfileIcon />
                <NotificationBell />
                <MoreOptionsMenu onSelectView={setSelectedView} />
              </Box>
            </Toolbar>
          </AppBar>

          <Container
            maxWidth="xl"
            sx={{
              mt: 4,
              mb: 4,
              position: 'relative',
              minHeight: 600,
            }}
          >
            <Routes>
              <Route path="/" element={<StockDashboard />} />
              <Route path="/analysis/:symbol" element={<FinancialAnalysisPage />} />
              <Route path="/backtest" element={<Backtest />} />
            </Routes>

            {selectedView === 'WatchList' && (
              <Box
                ref={tickerListRef}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: -150,
                  zIndex: 10,
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  width: 400
                }}
              >
                <TickerList />
              </Box>
            )}

            {selectedView === 'OptionPriceRatio' && (
              <Box
                ref={ratioRef}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: -150,
                  zIndex: 10,
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  width: 400
                }}
              >
                <OptionPriceRatio />
              </Box>
            )}

            {selectedView === 'News' && (
              <Box
                ref={newsRef}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: -150,
                  zIndex: 10,
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  width: 400
                }}
              >
                <News />
              </Box>
            )}
          </Container>
        </AlertsProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
