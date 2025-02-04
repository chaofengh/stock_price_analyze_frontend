// App.js
import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, AppBar, Toolbar, Typography } from '@mui/material';
import StockAnalysis from '../src/components/StockAnalysis';

const theme = createTheme({
  palette: {
    mode: 'light', // or 'dark' for a dark theme
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
    // … add custom shadow definitions as needed
  ],
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" elevation={4}>
        <Toolbar>
          <Typography variant="h6">Amazing Stock Dashboard</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <StockAnalysis />
      </Container>
    </ThemeProvider>
  );
}

export default App;
