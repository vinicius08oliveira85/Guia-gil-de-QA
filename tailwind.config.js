/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI Variable', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        'accent': {
          'light': '#2DD4BF',
          'DEFAULT': '#14B8A6',
          'dark': '#0D9488',
        },
        'surface': {
          'DEFAULT': 'var(--surface-color)',
          'border': 'var(--surface-border)',
          'hover': 'var(--surface-hover)',
        },
        'background': 'var(--bg-color)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
      }
    }
  },
  plugins: [],
}

