// theme.js
import { createTheme } from '@mui/material/styles';

// Dark "adult game" palette derived from Lumina mock
const PRIMARY_NEON   = '#00B8FF';
const ACCENT_ORANGE  = '#FF8A3D';
const ACCENT_RED     = '#FF5C5C';
const SUCCESS_GREEN  = '#4CE37E';
const BG_BASE        = '#0E1118';
const BG_SURFACE     = '#1B2333';
const BG_HEADER      = '#141B29';
const TEXT_PRIMARY   = '#E3ECFF';
const TEXT_SECONDARY = 'rgba(227,236,255,0.7)';
const DIVIDER_COLOR  = '#2B3245';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: PRIMARY_NEON,
      light: '#5cd7ff',
      dark: '#0093cc',
      contrastText: TEXT_PRIMARY,
    },
    secondary: {
      main: ACCENT_ORANGE,
      light: '#ffb07a',
      dark: '#cc6d2f',
      contrastText: TEXT_PRIMARY,
    },
    error: {
      main: ACCENT_RED,
    },
    success: {
      main: SUCCESS_GREEN,
    },
    warning: {
      main: ACCENT_ORANGE,
    },
    info: {
      main: PRIMARY_NEON,
    },
    background: {
      default: BG_BASE,
      paper: BG_SURFACE,
      header: BG_HEADER, // non-standard; consumed via theme.palette.background.header
    },
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_SECONDARY,
    },
    divider: DIVIDER_COLOR,
    // Custom semantic slots (optional)
    signalBuy: {
      main: ACCENT_ORANGE,
    },
    signalSell: {
      main: ACCENT_RED,
    },
    signalNeutral: {
      main: PRIMARY_NEON,
    },
  },

  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
      letterSpacing: 0.2,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: 0.15,
    },
    subtitle1: {
      fontSize: 18,
      color: TEXT_SECONDARY,
    },
    body2: {
      color: TEXT_SECONDARY,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BG_BASE,
          color: TEXT_PRIMARY,
          // Optional subtle background grid / noise (commented out)
          // backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          // backgroundSize: '4px 4px',
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BG_HEADER,
          backgroundImage: 'none',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: BG_SURFACE,
          backgroundImage: 'none',
          padding: '16px',
          marginBottom: '16px',
          border: `1px solid ${DIVIDER_COLOR}`,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.6)',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: BG_SURFACE,
          border: `1px solid ${DIVIDER_COLOR}`,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.6)',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        containedPrimary: {
          boxShadow: '0 0 8px rgba(0,184,255,0.6)',
        },
        containedSecondary: {
          boxShadow: '0 0 8px rgba(255,138,61,0.6)',
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 40,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: DIVIDER_COLOR,
        },
      },
    },
  },
});

export default theme;
