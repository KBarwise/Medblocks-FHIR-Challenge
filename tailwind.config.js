/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          900: '#0F1419',
          700: '#2D3748',
          500: '#5A6577',
          300: '#A0A8B5',
          100: '#E5E8ED',
          50: '#F4F6F8',
        },
        accent: { DEFAULT: '#0F6E56', soft: '#E1F5EE' },
        danger: { DEFAULT: '#A32D2D', soft: '#FCEBEB' },
        warning: { DEFAULT: '#854F0B', soft: '#FAEEDA' },
        info: { DEFAULT: '#185FA5', soft: '#E6F1FB' },
      },
      borderRadius: { md: '6px', lg: '10px' },
    },
  },
  plugins: [],
};
