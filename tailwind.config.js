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
        },
        // FishAI 2026 "glow-up" — exact palette extracted from the approved
        // Lovable design (fishai-glow-up.lovable.app): deep charcoal + teal.
        slate: {
          50: '#f7f9fa',
          100: '#eef0f2',
          200: '#dde0e4',
          300: '#b7bdc4',
          400: '#9399a0',
          500: '#5c646c',
          600: '#3a4148',
          700: '#292e35',
          800: '#1d2228',
          900: '#14191e',
          950: '#090e12',
        },
        emerald: {
          50: '#ecfdf7',
          100: '#d1fae8',
          200: '#a7f3d7',
          300: '#6ee7c0',
          400: '#33d4ad',
          500: '#27bd98',
          600: '#1ca184',
          700: '#15806a',
        },
      },
      fontFamily: {
        display: ['Oswald', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
