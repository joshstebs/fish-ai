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
        // Warm dark charcoal ramp (FishAI 2026 design refresh — matches the
        // approved concept screens: #0D1114 base, elevated warm cards).
        slate: {
          50: '#f7f9fb',
          100: '#ebeff3',
          200: '#d8dee5',
          300: '#b6c0cb',
          400: '#8a97a6',
          500: '#55616e',
          600: '#3a4551',
          700: '#2a333e',
          800: '#1e252e',
          900: '#151a21',
          950: '#0d1114',
        }
      }
    },
  },
  plugins: [],
}
