import { createTheme, responsiveFontSizes } from '@mui/material/styles'

import {
  RH_PRIMARY,
  RH_PRIMARY_DARK,
  RH_PRIMARY_LIGHT,
  rhElev,
  rhFocusRing,
  rhRadius,
} from './tokens'

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: RH_PRIMARY,
      dark: RH_PRIMARY_DARK,
      light: RH_PRIMARY_LIGHT,
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
    borderRadius: rhRadius.md,
  },
  typography: {
    fontFamily: '"Urbanist", "Inter", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Urbanist", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: 'clamp(1.75rem, 5vw, 3rem)',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      color: '#111827',
    },
    h2: {
      fontFamily: '"Urbanist", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
      lineHeight: 1.15,
      letterSpacing: '-0.02em',
      color: '#111827',
    },
    h3: {
      fontFamily: '"Urbanist", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '24px',
      lineHeight: 1.25,
      color: '#111827',
    },
    h4: {
      fontFamily: '"Urbanist", "Inter", sans-serif',
      fontWeight: 600,
      fontSize: '20px',
      lineHeight: 1.35,
      color: '#111827',
    },
    h5: {
      fontFamily: '"Urbanist", "Inter", sans-serif',
      fontWeight: 600,
      color: '#111827',
    },
    h6: {
      fontFamily: '"Urbanist", "Inter", sans-serif',
      fontWeight: 600,
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
      lineHeight: 1.55,
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
        ':root': {
          '--rh-primary': RH_PRIMARY,
          '--rh-primary-dark': RH_PRIMARY_DARK,
          '--rh-primary-light': RH_PRIMARY_LIGHT,
          '--rh-radius-sm': `${rhRadius.sm}px`,
          '--rh-radius-md': `${rhRadius.md}px`,
          '--rh-radius-lg': `${rhRadius.lg}px`,
          '--rh-elev-1': rhElev.elev1,
          '--rh-elev-2': rhElev.elev2,
          '--rh-elev-3': rhElev.elev3,
          '--rh-focus-ring': rhFocusRing,
        },
        html: {
          WebkitTapHighlightColor: 'transparent',
          overscrollBehaviorX: 'none',
        },
        body: {
          backgroundColor: '#FFFFFF',
          WebkitFontSmoothing: 'antialiased',
        },
        'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, [role="link"]:focus-visible, .MuiButtonBase-root:focus-visible':
          {
            outline: 'none',
            boxShadow: rhFocusRing,
          },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
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
          borderRadius: `${rhRadius.sm}px`,
          minHeight: 44,
          '@media (min-width: 900px)': {
            minHeight: 40,
          },
          '@media (pointer: fine) and (prefers-reduced-motion: no-preference)': {
            '&:active': {
              transform: 'scale(0.98)',
            },
          },
        },
        containedPrimary: {
          backgroundColor: RH_PRIMARY,
          color: '#FFFFFF',
          '@media (pointer: fine)': {
            '&:hover': {
              backgroundColor: RH_PRIMARY_DARK,
            },
          },
          '@media (pointer: coarse)': {
            '&:active': {
              backgroundColor: RH_PRIMARY_DARK,
            },
          },
        },
        outlinedPrimary: {
          borderWidth: '1.5px',
          '@media (pointer: fine)': {
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: RH_PRIMARY_LIGHT,
            },
          },
          '@media (pointer: coarse)': {
            '&:active': {
              borderWidth: '1.5px',
              backgroundColor: RH_PRIMARY_LIGHT,
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: rhRadius.md,
          minWidth: 44,
          minHeight: 44,
          '@media (min-width: 900px)': {
            minWidth: 40,
            minHeight: 40,
          },
          '@media (pointer: coarse)': {
            '&:active': {
              opacity: 0.88,
              transition: 'opacity 0.1s ease',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
          borderRadius: `${rhRadius.lg}px`,
          boxShadow: rhElev.elev1,
          backgroundColor: '#FFFFFF',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '@media (pointer: fine)': {
            '&:hover': {
              borderColor: '#D1D5DB',
              boxShadow: rhElev.elev2,
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          '@media (min-width: 900px)': {
            minHeight: 40,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: `${rhRadius.sm}px`,
          backgroundColor: '#F9FAFB',
          '& fieldset': {
            borderColor: '#E5E7EB',
          },
          '&:hover fieldset': {
            borderColor: '#D1D5DB',
          },
          '&.Mui-focused': {
            boxShadow: rhFocusRing,
          },
          '&.Mui-focused fieldset': {
            borderWidth: '2px',
            borderColor: RH_PRIMARY,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          overflow: 'visible',
          textOverflow: 'clip',
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
          borderRadius: `${rhRadius.sm}px`,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: `${rhRadius.lg}px`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          boxShadow: rhElev.elev3,
          borderRadius: `${rhRadius.lg}px`,
        },
      },
    },
  },
})

/** Smaller type on phones / narrow screens without editing every page. */
export const theme = responsiveFontSizes(baseTheme, { factor: 2 })
