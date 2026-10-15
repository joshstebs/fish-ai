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
          400: '#a0b1b4',
          500: '#93a6ad',
          600: '#3a4148',
          700: '#292e35',
          800: '#1d2228',
          900: '#11191d',
          950: '#090f12',
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
        // Each var holds space-separated sRGB channels (converted from the
        // project's original oklch values) so Tailwind v3 can emit alpha
        // modifiers — bg-primary/10, border-destructive/50, hover:border-primary/50 …
        // which it cannot do against raw oklch() strings.
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--color-card-foreground) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        popover: 'rgb(var(--color-popover) / <alpha-value>)',
        'popover-foreground': 'rgb(var(--color-popover-foreground) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-foreground': 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        destructive: 'rgb(var(--color-destructive) / <alpha-value>)',
        'destructive-foreground': 'rgb(var(--color-destructive-foreground) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Oswald', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

