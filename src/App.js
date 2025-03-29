// App.js
import React, { useState, useRef, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box
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
import News from './components/MoreOption/News';
import { GlobalStyles } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#00246B' },
    secondary: { main: '#CADCFC' },
    // This sets the background color for the entire page
    background: {
      default: '#e0e0e0', // Light gray
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 600 }
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 12 } } }
  }
});

function App() {
  const [selectedView, setSelectedView] = useState(null);

  // Refs for detecting outside clicks
  const tickerListRef = useRef(null);
  const ratioRef = useRef(null);
  const newsRef = useRef(null);

  // Listen for clicks anywhere on document
  useEffect(() => {
    function handleClickOutside(event) {
      // If TickerList is open and the click is outside its ref => close it
      if (
        selectedView === 'WatchList' &&
        tickerListRef.current &&
        !tickerListRef.current.contains(event.target)
      ) {
        // Check if the DataGrid column menu popover is open and contains the click
        const dataGridMenuEl = document.querySelector('.MuiDataGrid-menu');
        if (dataGridMenuEl && dataGridMenuEl.contains(event.target)) {
          // If the click is inside the column menu, do not close TickerList
          return;
        }
        setSelectedView(null);
      }

      // If OptionPriceRatio is open and click is outside => close it
      if (
        selectedView === 'OptionPriceRatio' &&
        ratioRef.current &&
        !ratioRef.current.contains(event.target)
      ) {
        setSelectedView(null);
      }

      // If News is open and the click is outside => close it
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
        {/* 
          Global styles to ensure page is full height and remove default margins.
          This helps the gray background fill the entire screen.
        */}
        <GlobalStyles
          styles={{
            'html, body, #root': {
              height: '100%',
              margin: 0,
              padding: 0
            }
          }}
        />
        <CssBaseline />
        <AlertsProvider>
          <AlertsSnackbar />

          <AppBar position="static" elevation={4}>
            <Toolbar sx={{ minHeight: 64 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
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
              minHeight: 600
            }}
          >
            <Routes>
              <Route path="/" element={<StockDashboard />} />
              <Route path="/analysis" element={<FinancialAnalysisPage />} />
            </Routes>

            {/* WatchList */}
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

            {/* OptionPriceRatio */}
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

            {/* News */}
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
