import { useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'leve-saude' | 'auto';

/**
 * Aplica o tema claro fixo em toda a aplicação.
 * O seletor de tema foi removido da UI; mantemos o hook para inicialização centralizada.
 */
export const useTheme = () => {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark', 'leve-saude');
    localStorage.setItem('theme', 'light');
  }, []);

  return {
    theme: 'light' as Theme,
    setTheme: () => undefined,
    toggleTheme: () => undefined,
    isOnlyLightSupported: true,
  };
};
