/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // This enables class-based dark mode
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': '0.875rem',   // 14px
        'sm': '1rem',       // 16px
        'base': '1.125rem', // 18px
        'lg': '1.25rem',    // 20px
        'xl': '1.5rem',     // 24px
        '2xl': '1.875rem',  // 30px
        '3xl': '2.25rem',   // 36px
        '4xl': '3rem',      // 48px
        '5xl': '3.75rem',   // 60px
        '6xl': '4.5rem',    // 72px
      },
      colors: {
        // Light mode colors
        primary: '#2563EB',
        secondary: '#0EA5E9',
        accent: '#22C55E',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#DC2626',
        info: '#0284C7',
      },
    },
  },
  plugins: [],
}