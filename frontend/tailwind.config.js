/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: '#0D0E11',
        subtle: '#6B7280',
        borderlight: '#E5E7EB',
        surface: '#FFFFFF',
        'surface-subtle': '#F9FAFB',
        'surface-card': '#F9FAFB',
        'surface-card-dark': '#141416',
        'border-hairline': '#E5E7EB',
        'border-dark': '#262626',
        'text-primary': '#111827',
        'text-muted': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
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