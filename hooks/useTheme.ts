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

    // Remove both classes first to avoid conflicts
    root.classList.remove('light', 'dark');
    
    // Apply base theme class
    root.classList.add(effectiveTheme);

    localStorage.setItem('theme', theme);

    // Apply custom theme preferences only if they exist
    // This should not interfere with the base dark/light theme
    const themePrefs = getThemePreferences();
    if (themePrefs.customColors || themePrefs.contrast !== 100 || themePrefs.fontSize !== 1 || themePrefs.spacing !== 1 || themePrefs.borderRadius !== 6 || themePrefs.opacity !== 100) {
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

