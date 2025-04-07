import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Wait for Telegram Web App script to load
const waitForTelegram = () => {
  return new Promise<void>((resolve) => {
    if (window.Telegram?.WebApp) {
      resolve();
      return;
    }

    // Check every 100ms for Telegram WebApp
    const interval = setInterval(() => {
      if (window.Telegram?.WebApp) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 5000);
  });
};

const initializeApp = async () => {
  try {
    // Wait for Telegram Web App to be available
    await waitForTelegram();

    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Root element not found');
    }

    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#fff;color:#000;padding:20px;text-align:center;';
    errorDiv.innerHTML = 'Failed to load application. Please try refreshing the page.';
    document.body.appendChild(errorDiv);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
