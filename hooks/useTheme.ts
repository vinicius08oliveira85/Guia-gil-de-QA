import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'leve-saude' | 'auto';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    // Nesta fase do Visual Reboot, apenas o tema DaisyUI "light" é suportado.
    // Mantemos o valor selecionado em localStorage para, no futuro, habilitar dark/auto/etc.
    root.setAttribute('data-theme', 'light');

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

  const isOnlyLightSupported = theme !== 'light';

  return { theme, setTheme, toggleTheme, isOnlyLightSupported };
};

