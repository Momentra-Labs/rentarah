import { createTheme } from '@mui/material/styles'

const cardShadow = '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)'
const cardShadowHover = '0 4px 12px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)'
const modalShadow = '0 20px 60px rgba(0,0,0,0.18)'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A56DB',
      dark: '#1549c2',
      light: '#EFF6FF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#111827',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F9FAFB',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    success: {
      main: '#059669',
    },
    error: {
      main: '#DC2626',
    },
    warning: {
      main: '#D97706',
    },
    divider: '#E5E7EB',
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      500: '#6B7280',
      900: '#111827',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 800,
      fontSize: '48px',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      color: '#111827',
    },
    h2: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: '36px',
      lineHeight: 1.15,
      letterSpacing: '-0.02em',
      color: '#111827',
    },
    h3: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: '24px',
      lineHeight: 1.25,
      color: '#111827',
    },
    h4: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '20px',
      lineHeight: 1.35,
      color: '#111827',
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.55,
      color: '#374151',
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#6B7280',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#6B7280',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
        },
        containedPrimary: {
          backgroundColor: '#1A56DB',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#1748b8',
          },
        },
        outlinedPrimary: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: '#EFF6FF',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          boxShadow: cardShadow,
          backgroundColor: '#FFFFFF',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: cardShadowHover,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: '#F9FAFB',
          '& fieldset': {
            borderColor: '#E5E7EB',
          },
          '&:hover fieldset': {
            borderColor: '#D1D5DB',
          },
          '&.Mui-focused fieldset': {
            borderWidth: '2px',
            borderColor: '#1A56DB',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: '16px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          boxShadow: modalShadow,
        },
      },
    },
  },
})
