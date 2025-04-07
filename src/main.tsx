import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const initializeApp = () => {
  try {
    const root = document.getElementById('root');

    if (!root) {
      throw new Error('Root element not found');
    }

    const rootElement = ReactDOM.createRoot(root);

    // Wrap in error boundary
    rootElement.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error UI
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
