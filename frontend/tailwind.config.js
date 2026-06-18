/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a73e8',
          light: '#e8f0fe',
          dark: '#1557b0',
        },
        danger: { DEFAULT: '#d93025', light: '#fce8e6' },
        success: { DEFAULT: '#1e8e3e', light: '#e6f4ea' },
        neutral: '#5f6368',
        border: '#dadce0',
        surface: '#ffffff',
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
}

