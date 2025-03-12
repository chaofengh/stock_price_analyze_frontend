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
import { AlertsProvider } from './components/Notification/AlertContext';
import StockDashboard from './components/StockDashboard';
import NotificationBell from './components/Notification/NotificationBell';
import MoreOptionsMenu from './components/MoreOptionsMenu';
import AlertsSnackbar from './components/Notification/AlertsSnackbar';
import OptionPriceRatio from './components/OptionPriceRatio';
import TickerList from './components/TickerList';

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

        {/* 
          Relative container so we can absolutely-position TickerList / Ratio
          to the top-right, near the 3-dot menu. Adjust 'top' or 'right' to suit.
        */}
        <Container
          maxWidth="xl"
          sx={{
            mt: 4,
            mb: 4,
            position: 'relative',
            minHeight: 600,
          }}
        >
          <StockDashboard />

          {selectedView === 'WatchList' && (
            <Box
              ref={tickerListRef}
              sx={{
                position: 'absolute',
                top: 0,
                right: -150,
                zIndex: 10
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
                zIndex: 10
              }}
            >
              <OptionPriceRatio />
            </Box>
          )}
        </Container>
      </AlertsProvider>
    </ThemeProvider>
  );
}

export default App;
