const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
// "blue", "sky" and "indigo" read their colors from CSS variables so the accent can be changed in Settings.
const slot = (name) => Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        blue: slot('a'),
        sky: slot('b'),
        indigo: slot('c'),
      },
      boxShadow: {
        soft: '0 1px 2px rgb(15 15 40 / 0.04), 0 8px 24px -8px rgb(15 15 40 / 0.10)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
