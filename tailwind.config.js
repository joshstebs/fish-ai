/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
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
        // Lovable design tokens (from lovable-project-a7525b… styles.css) so the
        // ported SetupFlow / UI use the exact same shadcn-style semantic colors.
        // Values are the project's oklch palette (deep blue-charcoal + teal).
        background: 'oklch(0.16 0.012 250)',
        foreground: 'oklch(0.96 0.004 250)',
        card: 'oklch(0.21 0.013 250)',
        'card-foreground': 'oklch(0.96 0.004 250)',
        panel: 'oklch(0.25 0.014 250)',
        popover: 'oklch(0.21 0.013 250)',
        'popover-foreground': 'oklch(0.96 0.004 250)',
        primary: 'oklch(0.78 0.14 172)',
        'primary-foreground': 'oklch(0.18 0.02 190)',
        secondary: 'oklch(0.27 0.014 250)',
        'secondary-foreground': 'oklch(0.96 0.004 250)',
        muted: 'oklch(0.27 0.014 250)',
        'muted-foreground': 'oklch(0.68 0.012 250)',
        accent: 'oklch(0.78 0.14 172)',
        'accent-foreground': 'oklch(0.18 0.02 190)',
        destructive: 'oklch(0.62 0.2 25)',
        'destructive-foreground': 'oklch(0.98 0 0)',
        border: 'oklch(0.3 0.014 250)',
        input: 'oklch(0.3 0.014 250)',
        ring: 'oklch(0.78 0.14 172)',
      },
      fontFamily: {
        display: ['Oswald', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
