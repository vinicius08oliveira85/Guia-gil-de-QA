import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'leve-saude' | 'auto';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    // Determinar qual tema aplicar
    let themeToApply: string = 'light';
    if (theme === 'auto') {
      // Usar preferência do sistema para modo automático
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    } else if (theme === 'dark') {
      themeToApply = 'dark';
    } else if (theme === 'light') {
      themeToApply = 'light';
    } else {
      // Para outros temas (leve-saude), manter light por enquanto
      themeToApply = 'light';
    }

    root.setAttribute('data-theme', themeToApply);

    // Remover classes legadas para evitar conflitos com CSS antigo (cleanup está em andamento).
    root.classList.remove('light', 'dark', 'leve-saude');

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

