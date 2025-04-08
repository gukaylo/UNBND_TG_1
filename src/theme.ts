import { createTheme, ThemeOptions } from '@mui/material/styles';

const getTelegramTheme = () => {
  const root = document.documentElement;
  return {
    bgColor: getComputedStyle(root).getPropertyValue('--tg-theme-bg-color').trim() || '#ffffff',
    textColor: getComputedStyle(root).getPropertyValue('--tg-theme-text-color').trim() || '#000000',
    hintColor: getComputedStyle(root).getPropertyValue('--tg-theme-hint-color').trim() || '#999999',
    linkColor: getComputedStyle(root).getPropertyValue('--tg-theme-link-color').trim() || '#2481cc',
    buttonColor: getComputedStyle(root).getPropertyValue('--tg-theme-button-color').trim() || '#2481cc',
    buttonTextColor: getComputedStyle(root).getPropertyValue('--tg-theme-button-text-color').trim() || '#ffffff',
    secondaryBgColor: getComputedStyle(root).getPropertyValue('--tg-theme-secondary-bg-color').trim() || '#f0f0f0',
  };
};

export const createTelegramTheme = (): ThemeOptions => {
  const telegramTheme = getTelegramTheme();
  
  return {
    palette: {
      mode: 'light',
      primary: {
        main: telegramTheme.buttonColor,
        contrastText: telegramTheme.buttonTextColor,
      },
      background: {
        default: telegramTheme.bgColor,
        paper: telegramTheme.secondaryBgColor,
      },
      text: {
        primary: telegramTheme.textColor,
        secondary: telegramTheme.hintColor,
      },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: '1rem',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
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
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${telegramTheme.secondaryBgColor}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  };
};

export const theme = createTheme(createTelegramTheme()); 