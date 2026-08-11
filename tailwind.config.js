/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#030816',
          900: '#07132b',
          800: '#0c224a',
          700: '#13356f',
        }
      }
    },
  },
  plugins: [],
}
