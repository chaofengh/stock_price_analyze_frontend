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
import NotificationBell from './components/Notification/NotificationBell';
import MoreOptionsMenu from './components/MoreOptionsMenu';
import AlertsSnackbar from './components/Notification/AlertsSnackbar';
import OptionPriceRatio from './components/OptionPriceRatio';
import TickerList from './components/TickerList';
import FinancialAnalysisPage from './components/FinancialAnalysisPage';


const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0d47a1' },
    secondary: { main: '#f57c00' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiCard:  { styleOverrides: { root: { borderRadius: 12 } } },
  },
});

function App() {
  const [selectedView, setSelectedView] = useState(null);

  // Refs for detecting outside clicks
  const tickerListRef = useRef(null);
  const ratioRef = useRef(null);

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
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedView]);

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AlertsProvider>
          <AlertsSnackbar />

          <AppBar position="static" elevation={4}>
            <Toolbar sx={{ minHeight: 64 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                UltraPro Stock Dashboard
              </Typography>
              <NotificationBell />
              <MoreOptionsMenu onSelectView={setSelectedView} />
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
              <Route path="/analysis" element={<FinancialAnalysisPage />} />
            </Routes>
            {selectedView === 'WatchList' && (
              <Box
                ref={tickerListRef}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: -150,
                  zIndex: 10,
                  // Set a max height and enable scrolling
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  // Optional width so the box doesn't shrink
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
                  // Optional width so the box doesn't shrink
                  width: 400
                }}
              >
                <OptionPriceRatio />
              </Box>
            )}
          </Container>
        </AlertsProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
