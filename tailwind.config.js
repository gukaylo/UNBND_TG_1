/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tg-theme-bg': 'var(--tg-theme-bg-color)',
        'tg-theme-text': 'var(--tg-theme-text-color)',
        'tg-theme-hint': 'var(--tg-theme-hint-color)',
        'tg-theme-link': 'var(--tg-theme-link-color)',
        'tg-theme-button': 'var(--tg-theme-button-color)',
        'tg-theme-button-text': 'var(--tg-theme-button-text-color)',
        'tg-theme-secondary-bg': 'var(--tg-theme-secondary-bg-color)',
      },
      padding: {
        '3': '0.75rem',
      },
      margin: {
        '2': '0.5rem',
      },
      borderRadius: {
        'lg': '0.5rem',
      },
      fontSize: {
        'sm': '0.875rem',
        'lg': '1.125rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
} 