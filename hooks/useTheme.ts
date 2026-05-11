import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'leve-saude' | 'auto';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    // Determinar qual tema aplicar (DaisyUI: `dim` = identidade escura com primary #8c5cff em tailwind.config.js)
    let themeToApply: string = 'light';
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dim' : 'light';
    } else if (theme === 'dark') {
      themeToApply = 'dim';
    } else if (theme === 'light') {
      themeToApply = 'light';
    } else {
      themeToApply = 'light';
    }

    root.setAttribute('data-theme', themeToApply);

    // Classe `dark` no elemento raiz ativa variantes Tailwind `dark:`; `data-theme="dim"` aplica tokens DaisyUI Dim.
    root.classList.remove('light', 'leve-saude');
    if (themeToApply === 'dim') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'leve-saude';
      if (prev === 'leve-saude') return 'auto';
      return 'light';
    });
  };

  // Verificar se apenas light é suportado (para temas futuros como leve-saude)
  const isOnlyLightSupported = theme === 'leve-saude' || theme === 'auto';

  return { theme, setTheme, toggleTheme, isOnlyLightSupported };
};
