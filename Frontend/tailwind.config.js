/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Latin glyphs render in Inter; Devanagari falls through to Noto Sans Devanagari.
        sans: ['Inter', '"Noto Sans Devanagari"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#f1f5fa',
        // Deep navy: top header, hero, footer, admin sidebar.
        navy: {
          50: '#eef2f9',
          100: '#d5deee',
          200: '#a9bbdb',
          300: '#7690c0',
          400: '#4c69a3',
          500: '#2f4d8a',
          600: '#1f3d78',
          700: '#163266',
          800: '#102a5a',
          900: '#0b234f',
          950: '#071937',
        },
        // Royal blue: links, active navigation, primary actions.
        brand: {
          50: '#eef3fe',
          100: '#dce6fd',
          200: '#bcd0fb',
          300: '#8eaff7',
          400: '#5b86f0',
          500: '#3463e6',
          600: '#2350d6',
          700: '#1c40b0',
          800: '#1c378c',
          900: '#1c3270',
        },
        // Muted desert tones for the hero horizon.
        earth: {
          400: '#6b5a52',
          500: '#54474a',
          600: '#433b44',
          700: '#332f3f',
        },
        saffron: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc070',
          400: '#ff9a37',
          500: '#f97d12',
          600: '#e06208',
          700: '#b94a09',
          800: '#933a0f',
          900: '#773110',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.04)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop-in': {
          from: { opacity: 0, transform: 'translateY(6px) scale(0.98)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'slide-down': {
          from: { opacity: 0, transform: 'translateY(-6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'pop-in': 'pop-in 180ms ease-out',
        'slide-down': 'slide-down 160ms ease-out',
      },
    },
  },
  plugins: [],
}
