// Initialize Telegram Web App
(function() {
  // Check if Telegram Web App is available
  if (window.Telegram && window.Telegram.WebApp) {
    try {
      // Initialize the Web App
      window.Telegram.WebApp.ready();
      
      // Get Telegram theme colors and parameters
      const colorScheme = window.Telegram.WebApp.colorScheme;
      const themeParams = window.Telegram.WebApp.themeParams;
      
      // Set the background color based on Telegram's theme
      const bgColor = colorScheme === 'dark' ? '#1C1C1E' : '#ffffff';
      window.Telegram.WebApp.setBackgroundColor(bgColor);
      
      // Update CSS variables based on Telegram theme
      document.documentElement.style.setProperty('--tg-theme-bg-color', bgColor);
      document.documentElement.style.setProperty('--tg-theme-text-color', colorScheme === 'dark' ? '#ffffff' : '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', colorScheme === 'dark' ? '#8e8e93' : '#8e8e93');
      document.documentElement.style.setProperty('--tg-theme-link-color', themeParams?.link_color || '#0A84FF');
      document.documentElement.style.setProperty('--tg-theme-button-color', themeParams?.button_color || '#0A84FF');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams?.button_text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0');
      
      // Expand the Web App to full height
      window.Telegram.WebApp.expand();
      
      // Enable closing confirmation if needed
      window.Telegram.WebApp.enableClosingConfirmation();
      
      // Add a class to the body to indicate Telegram Web App
      document.body.classList.add('telegram-webapp');
      
      // Set a flag to indicate Telegram Web App is initialized
      window.isTelegramWebApp = true;
      
      console.log('Telegram Web App initialized successfully');
    } catch (error) {
      console.error('Error initializing Telegram Web App:', error);
      window.isTelegramWebApp = false;
    }
  } else {
    console.log('Telegram Web App not available');
    window.isTelegramWebApp = false;
  }
})(); 