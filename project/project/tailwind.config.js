/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'uc-black': '#000000',
        'uc-purple': {
          DEFAULT: '#B026FF',
          50: 'rgba(176, 38, 255, 0.05)',
          100: 'rgba(176, 38, 255, 0.1)',
          200: 'rgba(176, 38, 255, 0.2)',
          300: 'rgba(176, 38, 255, 0.3)',
          400: 'rgba(176, 38, 255, 0.4)',
          500: 'rgba(176, 38, 255, 0.5)',
          600: 'rgba(176, 38, 255, 0.6)',
          700: 'rgba(176, 38, 255, 0.7)',
          800: 'rgba(176, 38, 255, 0.8)',
          900: 'rgba(176, 38, 255, 0.9)',
        },
        'uc-white': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1.2' }],
        'subtitle': ['1.5rem', { lineHeight: '1.5' }],
      },
      spacing: {
        '8': '8px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(176, 38, 255, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(176, 38, 255, 0.6)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(176, 38, 255, 0.4)',
      },
    },
  },
  plugins: [],
};