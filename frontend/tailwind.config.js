/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core Swiss Monolith & Mobbin tokens
        background: '#f9f9fa',
        surface: '#f9f9fa',
        'surface-dim': '#dadadb',
        'surface-bright': '#f9f9fa',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f4',
        'surface-container': '#eeeeef',
        'surface-container-high': '#e8e8e9',
        'surface-container-highest': '#e2e2e3',
        'on-surface': '#1a1c1d',
        'on-surface-variant': '#47464a',
        'surface-canvas-light': '#FFFFFF',
        'surface-card-light': '#F7F7F8',
        'surface-canvas-dark': '#0A0A0B',
        'surface-card-dark': '#141416',
        'border-hairline-light': '#E4E4E7',
        'border-hairline-dark': '#27272A',
        'text-primary-light': '#09090B',
        'text-secondary-light': '#71717A',
        'text-primary-dark': '#FAFAFA',
        'text-secondary-dark': '#A1A1AA',
        'accent-interactive': '#2563EB',
        'accent-emerald': '#10B981',
        'accent-amber': '#F59E0B',
        'accent-rose': '#EF4444',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem',  // 4px
        md: '0.5rem',   // 8px
        lg: '0.75rem',  // 12px
        xl: '1rem',     // 16px
        '2xl': '1.25rem', // 20px
        '3xl': '1.5rem',  // 24px
        full: '9999px',
      },
    },
  },
  plugins: [],
};