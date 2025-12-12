import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'leve-saude' | 'auto';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    // Remove all theme classes first to avoid conflicts
    root.classList.remove('light', 'dark', 'leve-saude');
    
    // Apply base theme class
    root.classList.add(effectiveTheme);

    // Apply DaisyUI theme attribute for 'light' theme
    if (effectiveTheme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'leve-saude';
      if (prev === 'leve-saude') return 'dark';
      return 'dark';
    });
  };

  return { theme, setTheme, toggleTheme };
};

