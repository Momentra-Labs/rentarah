import { createTheme } from '@mui/material/styles'

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1A56DB', dark: '#1446B8', light: '#3B74E8' },
    secondary: { main: '#334155' },
    success: { main: '#059669' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
    background: {
      default: '#E8EDF7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: 'rgba(148,163,184,0.35)',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Urbanist", system-ui, sans-serif',
    h4: {
      fontFamily: '"Urbanist", "Inter", sans-serif',
      fontWeight: 800,
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '1.875rem',
      },
    },
    h6: { fontFamily: '"Urbanist", "Inter", sans-serif', fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
    caption: { letterSpacing: '0.015em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(ellipse 120% 80% at 100% -20%, rgba(26,86,219,0.09), transparent 45%), radial-gradient(ellipse 80% 50% at 0% 100%, rgba(99,102,241,0.06), transparent 40%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 999,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 14px rgba(26,86,219,0.28)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor: theme.palette.common.white,
        }),
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: 'rgba(26,86,219,0.45)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
})
