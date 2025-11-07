/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bulgarian theme colors
        primary: {
          DEFAULT: '#DC143C',
          50: '#FCE8EC',
          100: '#F9D1D9',
          200: '#F3A3B3',
          300: '#ED758D',
          400: '#E74767',
          500: '#DC143C',
          600: '#B01030',
          700: '#840C24',
          800: '#580818',
          900: '#2C040C',
        },
        secondary: {
          DEFAULT: '#2E7D32',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#2E7D32',
          600: '#2E7D32',
          700: '#1B5E20',
          800: '#194D1C',
          900: '#103C14',
        },
        background: '#F5F5F5',
        surface: '#FFFFFF',
        text: {
          primary: '#212121',
          secondary: '#757575',
        },
        price: {
          up: '#D32F2F',
          down: '#2E7D32',
          stable: '#757575',
        },
        status: {
          pending: '#FF9800',
          approved: '#4CAF50',
          rejected: '#F44336',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
}
