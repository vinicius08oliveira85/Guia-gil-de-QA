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
    extend: {
      fontFamily: {
        sans: ['Segoe UI Variable', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Windows 12 Bold Accent Colors
        'accent': {
          'light': '#67E8F9',  // cyan-300
          'DEFAULT': '#22D3EE', // cyan-400
          'dark': '#06B6D4',   // cyan-500
        },
        'accent-secondary': {
          'light': '#A78BFA',  // violet-400
          'DEFAULT': '#8B5CF6', // violet-500
          'dark': '#7C3AED',   // violet-600
        },
        'accent-tertiary': {
          'light': '#E879F9',  // fuchsia-400
          'DEFAULT': '#D946EF', // fuchsia-500
          'dark': '#C026D3',   // fuchsia-600
        },
        'surface': {
          'DEFAULT': 'var(--surface-color)',
          'border': 'var(--surface-border)',
          'hover': 'var(--surface-hover)',
          'contrast': 'var(--surface-contrast)',
        },
        'background': 'var(--bg-color)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
      },
      boxShadow: {
        'glow-cyan': '0 0 60px rgba(34, 211, 238, 0.25)',
        'glow-violet': '0 0 60px rgba(139, 92, 246, 0.25)',
        'glow-emerald': '0 0 60px rgba(16, 185, 129, 0.25)',
        'glow-fuchsia': '0 0 60px rgba(217, 70, 239, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    }
  },
  plugins: [],
}

