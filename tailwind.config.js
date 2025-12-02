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
        heading: ['Poppins', 'Montserrat', 'Segoe UI Variable', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'Segoe UI Variable', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        'accent': {
          'light': '#2DD4BF',
          'DEFAULT': '#14B8A6',
          'dark': '#0D9488',
        },
        // Cores Leve Saúde
        'leve': {
          'primary': '#109685',
          'primary-dark': '#007367',
          'primary-deep': '#0B6156',
          'accent': '#FB4C00',
          'accent-2': '#FC4C02',
          'success': '#15803D',
          'navy': '#191970',
          'text': '#333333',
          'muted': '#7F7F7F',
          'bg': '#FFFFFF',
          'surface': '#F6F6F6',
          'surface-alt': '#F2F2F2',
          'border': '#C6BEBF',
          'soft-bg': '#EAF3EE',
        },
        'primary-leve': '#FC4C02',
        'secondary-leve': '#126232',
        'success': 'var(--success-color)',
        'warning': 'var(--warning-color)',
        'danger': 'var(--danger-color)',
        'info': 'var(--info-color)',
        'surface': {
          'DEFAULT': 'var(--surface-color)',
          'border': 'var(--surface-border)',
          'hover': 'var(--surface-hover)',
        },
        'background': 'var(--bg-color)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      fontSize: {
        'h1': 'var(--fs-h1)',
        'h2': 'var(--fs-h2)',
        'h3': 'var(--fs-h3)',
        'h4': 'var(--fs-h4)',
        'body': 'var(--fs-body)',
        'small': 'var(--fs-small)',
        'label': 'var(--fs-label)',
      },
      lineHeight: {
        'tight': 'var(--lh-tight)',
        'normal': 'var(--lh-normal)',
        'comfortable': 'var(--lh-comfortable)',
        'relaxed': 'var(--lh-relaxed)',
      },
      borderRadius: {
        'leve-sm': 'var(--radius-sm)',
        'leve-md': 'var(--radius-md)',
        'leve-lg': 'var(--radius-lg)',
        'leve-xl': 'var(--radius-xl)',
      },
    }
  },
  plugins: [],
}

