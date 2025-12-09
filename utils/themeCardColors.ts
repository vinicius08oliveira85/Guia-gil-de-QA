import { Theme } from '../hooks/useTheme';

/**
 * Retorna classes CSS para cards informativos baseadas no tema
 * Melhora o contraste especialmente para o tema leve-saude
 */
export const getInfoCardClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'bg-blue-500/15 border-blue-500/40 text-text-primary';
    case 'light':
      return 'bg-blue-50 border-blue-200 text-blue-900';
    case 'leve-saude':
      // Cores inspiradas no site da Leve Saúde para melhor contraste
      return 'bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950/30 dark:border-orange-500/50 dark:text-orange-100';
    case 'auto':
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark 
        ? 'bg-blue-500/15 border-blue-500/40 text-text-primary'
        : 'bg-blue-50 border-blue-200 text-blue-900';
    default:
      return 'bg-blue-500/15 border-blue-500/40 text-text-primary';
  }
};

/**
 * Retorna classes CSS para cards de sucesso baseadas no tema
 */
export const getSuccessCardClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'bg-green-500/15 border-green-500/40 text-text-primary';
    case 'light':
      return 'bg-green-50 border-green-200 text-green-900';
    case 'leve-saude':
      return 'bg-green-50 border-green-300 text-green-900 dark:bg-green-950/30 dark:border-green-500/50 dark:text-green-100';
    case 'auto':
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark 
        ? 'bg-green-500/15 border-green-500/40 text-text-primary'
        : 'bg-green-50 border-green-200 text-green-900';
    default:
      return 'bg-green-500/15 border-green-500/40 text-text-primary';
  }
};

/**
 * Retorna classes CSS para cards de erro/alerta baseadas no tema
 */
export const getErrorCardClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'bg-red-500/15 border-red-500/40 text-text-primary';
    case 'light':
      return 'bg-red-50 border-red-200 text-red-900';
    case 'leve-saude':
      return 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/30 dark:border-red-500/50 dark:text-red-100';
    case 'auto':
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark 
        ? 'bg-red-500/15 border-red-500/40 text-text-primary'
        : 'bg-red-50 border-red-200 text-red-900';
    default:
      return 'bg-red-500/15 border-red-500/40 text-text-primary';
  }
};

/**
 * Retorna classes CSS para cards de warning baseadas no tema
 */
export const getWarningCardClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'bg-yellow-500/15 border-yellow-500/40 text-text-primary';
    case 'light':
      return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    case 'leve-saude':
      return 'bg-yellow-50 border-yellow-300 text-yellow-900 dark:bg-yellow-950/30 dark:border-yellow-500/50 dark:text-yellow-100';
    case 'auto':
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark 
        ? 'bg-yellow-500/15 border-yellow-500/40 text-text-primary'
        : 'bg-yellow-50 border-yellow-200 text-yellow-900';
    default:
      return 'bg-yellow-500/15 border-yellow-500/40 text-text-primary';
  }
};

/**
 * Retorna classes CSS para texto secundário em cards baseadas no tema
 */
export const getCardTextSecondaryClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'text-text-secondary';
    case 'light':
      return 'text-gray-700';
    case 'leve-saude':
      return 'text-orange-800 dark:text-orange-200';
    case 'auto':
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'text-text-secondary' : 'text-gray-700';
    default:
      return 'text-text-secondary';
  }
};

