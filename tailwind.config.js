/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./index.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./api/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'sm': '640px',   // Tablet pequeno
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop pequeno - PRIORIDADE WEB
      'xl': '1280px',  // Desktop - PRIORIDADE WEB
      '2xl': '1536px', // Desktop grande
    },
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

