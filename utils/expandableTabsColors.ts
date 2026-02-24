import { Theme } from '../hooks/useTheme';

/**
 * Retorna a classe de cor ativa para o ExpandableTabs baseada no tema atual
 * 
 * @param theme - Tema atual da aplicação
 * @returns Classe Tailwind CSS para a cor ativa
 * 
 * @example
 * ```ts
 * const activeColor = getActiveColorForTheme('dark');
 * <ExpandableTabs activeColor={activeColor} />
 * ```
 */
export const getActiveColorForTheme = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'text-blue-500';
    case 'light':
      return 'text-blue-600';
    case 'leve-saude':
      return 'text-orange-500';
    case 'auto':
      // Para auto, usar o tema efetivo baseado na preferência do sistema
    {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'text-blue-500' : 'text-blue-600';
    }
    default:
      return 'text-accent';
  }
};

