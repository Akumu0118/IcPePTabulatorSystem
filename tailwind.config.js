/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#0f172a',
          900: '#0b1329',
          950: '#060a17',
        },
        royal: {
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        softpink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        }
      }
    },
  },
  plugins: [],
}