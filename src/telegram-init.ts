// Initialize Telegram Web App
export function initTelegramWebApp() {
  if (window.Telegram?.WebApp) {
    try {
      // Initialize the Web App first
      window.Telegram.WebApp.ready();
      
      // Get Telegram theme colors and parameters
      const colorScheme = window.Telegram.WebApp.colorScheme;
      const themeParams = window.Telegram.WebApp.themeParams;
      
      // Set the background color based on Telegram's theme
      const bgColor = colorScheme === 'dark' ? '#1C1C1E' : '#ffffff';
      window.Telegram.WebApp.setBackgroundColor(bgColor);
      
      // Update CSS variables based on Telegram theme
      document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || bgColor);
      document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || (colorScheme === 'dark' ? '#ffffff' : '#000000'));
      document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#8e8e93');
      document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#0A84FF');
      document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#0A84FF');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || (colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0'));
      
      // Expand the Web App to full height and enable closing confirmation
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.enableClosingConfirmation();
      
      // Add a class to the body to indicate Telegram Web App
      document.body.classList.add('telegram-webapp');
      
      // Force a re-render to ensure proper layout
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        // Force redraw of bottom navigation
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
          bottomNav.classList.add('force-redraw');
          setTimeout(() => bottomNav.classList.remove('force-redraw'), 100);
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error initializing Telegram Web App:', error);
      return false;
    }
  }
  return false;
} 