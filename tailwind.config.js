/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', 'sans-serif'],
      },
      colors: {
        // ── Muzli Triade Palette ────────────────────────────────────────────
        'primary': {
          DEFAULT: '#A9C652',
          dark: '#7a8b39',
          light: '#c8df7c',
        },
        'secondary': {
          DEFAULT: '#6262c6',
          dark: '#45458b',
          light: '#9090d8',
        },
        'destructive-rust': '#c66952',

        // ── Aliases so existing className strings compile without JSX edits ─
        // electric-green / emerald-bright were the old custom tokens
        'electric-green': '#A9C652',
        'emerald-bright': '#7a8b39',

        // Convenience shorthand used across pages
        'secondary-dark': '#45458b',
        'primary-dark': '#7a8b39',
      },
      animation: {
        'terminal-blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
