/** @type {import('tailwindcss').Config} */

// Tenta importar tokens gerados (opcional - fallback para valores padrão)
// Nota: Se tokens não existirem, usa valores padrão do CSS
let designTokens = {};
try {
  // Importação síncrona não funciona com ES modules, então usamos valores padrão
  // Os tokens serão aplicados via CSS variables no index.css
} catch (error) {
  // Se tokens não existirem, usa valores padrão
}

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./index.{js,ts,jsx,tsx}",
    "./App.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./api/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./stories/**/*.{js,ts,jsx,tsx}",
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
        ...(designTokens.fontFamily || {}),
        sans: designTokens.fontFamily?.sans || ['Segoe UI Variable', 'Segoe UI', 'sans-serif'],
        heading: designTokens.fontFamily?.heading || ['Poppins', 'Montserrat', 'Segoe UI Variable', 'Segoe UI', 'sans-serif'],
        body: designTokens.fontFamily?.body || ['Inter', 'Segoe UI Variable', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        ...(designTokens.colors || {}),
        // Aliases utilitários (não conflitam com DaisyUI)
        // Obs: DaisyUI expõe tokens via CSS vars (ex.: --b1/--b2/--b3/--bc/--er)
        danger: 'oklch(var(--er) / <alpha-value>)',
        surface: {
          DEFAULT: 'oklch(var(--b1) / <alpha-value>)',
          border: 'oklch(var(--b3) / <alpha-value>)',
          hover: 'oklch(var(--b2) / <alpha-value>)',
        },
        background: 'oklch(var(--b1) / <alpha-value>)',
        'text-primary': 'oklch(var(--bc) / <alpha-value>)',
        'text-secondary': 'oklch(var(--bc) / 0.72)',
        'text-tertiary': 'oklch(var(--bc) / 0.56)',
        muted: 'oklch(var(--bc) / 0.6)',
      },
      spacing: {
        ...(designTokens.spacing || {}),
        'xs': designTokens.spacing?.xs || 'var(--spacing-xs)',
        'sm': designTokens.spacing?.sm || 'var(--spacing-sm)',
        'md': designTokens.spacing?.md || 'var(--spacing-md)',
        'lg': designTokens.spacing?.lg || 'var(--spacing-lg)',
        'xl': designTokens.spacing?.xl || 'var(--spacing-xl)',
        '2xl': designTokens.spacing?.['2xl'] || 'var(--spacing-2xl)',
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
        ...(designTokens.borderRadius || {}),
        'leve-sm': designTokens.borderRadius?.sm || 'var(--radius-sm)',
        'leve-md': designTokens.borderRadius?.md || 'var(--radius-md)',
        'leve-lg': designTokens.borderRadius?.lg || 'var(--radius-lg)',
        'leve-xl': designTokens.borderRadius?.xl || 'var(--radius-xl)',
      },
      boxShadow: {
        ...(designTokens.boxShadow || {}),
      },
    }
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          "base-100": "oklch(100% 0 0)",
          "base-200": "#f2f2f2",
          "base-300": "#f2f2f2",
          "base-content": "#451e44",
          "primary": "#fb4c00",
          "primary-content": "oklch(100% 0 0)",
          "secondary": "#451e44",
          "secondary-content": "oklch(100% 0 0)",
          "accent": "#451e44",
          "accent-content": "#fcf9ec",
          "neutral": "#fcf9ec",
          "neutral-content": "#451e44",
          "info": "#fb4c00",
          "info-content": "#451e44",
          "success": "oklch(59% 0.145 163.225)",
          "success-content": "oklch(98% 0.003 247.858)",
          "warning": "#f2f2f2",
          "warning-content": "oklch(57% 0.245 27.325)",
          "error": "oklch(50% 0.213 27.518)",
          "error-content": "oklch(98% 0.003 247.858)",
          "--rounded-box": "2rem",
          "--rounded-btn": "2rem",
          "--rounded-badge": "2rem",
          "--tab-radius": "2rem",
        },
      },
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}

