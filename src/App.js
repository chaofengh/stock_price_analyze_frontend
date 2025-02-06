// App.js
import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, AppBar, Toolbar, Typography } from '@mui/material';
import StockDashboard from './components/StockDashboard';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0d47a1' },
    secondary: { main: '#f57c00' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" elevation={4}>
        <Toolbar>
          <Typography variant="h6">UltraPro Stock Dashboard</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <StockDashboard />
      </Container>
    </ThemeProvider>
  );
}

export default App;
