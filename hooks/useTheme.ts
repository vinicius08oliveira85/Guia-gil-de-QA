import { useState, useEffect } from 'react';
import { getThemePreferences, applyTheme } from '../utils/themeEngine';

export type Theme = 'light' | 'dark' | 'auto';

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

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);

    // Apply custom theme preferences
    const themePrefs = getThemePreferences();
    if (themePrefs.customColors || themePrefs.contrast !== 100 || themePrefs.fontSize !== 1) {
      applyTheme(themePrefs);
    }
  }, [theme]);

  useEffect(() => {
    // Listen for theme preference updates
    const handlePreferencesUpdate = () => {
      const themePrefs = getThemePreferences();
      if (themePrefs.customColors || themePrefs.contrast !== 100 || themePrefs.fontSize !== 1) {
        applyTheme(themePrefs);
      }
    };
    window.addEventListener('preferences-updated', handlePreferencesUpdate);
    return () => window.removeEventListener('preferences-updated', handlePreferencesUpdate);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'auto';
      return 'dark';
    });
  };

  return { theme, setTheme, toggleTheme };
};

