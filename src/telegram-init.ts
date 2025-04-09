// Initialize Telegram Web App
export function initTelegramWebApp() {
  if (!window.Telegram?.WebApp) {
    console.error('Telegram WebApp is not available');
    return false;
  }

  try {
    const webapp = window.Telegram.WebApp;
    
    // First, set the viewport color to match theme
    const colorScheme = webapp.colorScheme || 'light';
    const themeParams = webapp.themeParams || {};
    
    // Get background color from Telegram theme
    const bgColor = themeParams.bg_color;
    
    // Set background color BEFORE any other initialization
    webapp.setBackgroundColor(bgColor);
    
    // Set theme variables
    const root = document.documentElement;
    root.style.setProperty('--tg-theme-bg-color', bgColor);
    root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
    root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
    root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
    root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
    root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
    root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);

    // Set color scheme class
    document.body.classList.add('telegram-webapp');
    document.body.classList.add(`color-scheme-${colorScheme}`);
    
    // Set main background color
    document.body.style.backgroundColor = bgColor;
    document.documentElement.style.backgroundColor = bgColor;
    
    // Initialize the Web App
    webapp.ready();
    
    // Expand to full height
    webapp.expand();
    
    // Enable closing confirmation
    webapp.enableClosingConfirmation();
    
    // Set up MainButton if needed
    if (webapp.MainButton) {
      webapp.MainButton.setParams({
        text: 'Start Chat',
        color: themeParams.button_color,
        text_color: themeParams.button_text_color,
      });
    }
    
    // Set up BackButton if needed
    if (webapp.BackButton) {
      webapp.BackButton.hide();
    }
    
    // Force immediate layout update
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });

    return true;
  } catch (error) {
    console.error('Error initializing Telegram Web App:', error);
    return false;
  }
} 