// theme.js
import { createTheme } from '@mui/material/styles';

// Custom color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Primary color
    },
    secondary: {
      main: '#dc004e', // Secondary color
    },
    background: {
      default: '#f5f5f5', // Background color
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h5: {
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: 18,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '16px',
          marginBottom: '16px',
        },
      },
    },
  },
});

export default theme;
