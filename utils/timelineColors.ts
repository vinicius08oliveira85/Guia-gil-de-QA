import { Theme } from '../hooks/useTheme';

/**
 * Retorna classes CSS para o card ativo do timeline baseado no tema
 */
export const getActiveCardClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'border-surface-border bg-surface shadow-lg';
    case 'light':
      return 'border-surface-border bg-surface shadow-lg';
    case 'leve-saude':
      return 'border-surface-border bg-surface shadow-lg';
    case 'auto': {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark
        ? 'border-surface-border bg-surface shadow-lg'
        : 'border-surface-border bg-surface shadow-lg';
    }
    default:
      return 'border-surface-border bg-surface shadow-lg';
  }
};

/**
 * Retorna classes CSS para o card inativo do timeline baseado no tema
 */
export const getInactiveCardClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'border-surface-border/50 bg-surface/60';
    case 'light':
      return 'border-surface-border/60 bg-surface/70';
    case 'leve-saude':
      return 'border-surface-border/60 bg-surface/70';
    default:
      return 'border-surface-border/50 bg-surface/60';
  }
};

/**
 * Retorna classes CSS para o ícone ativo do timeline baseado no tema
 */
export const getActiveIconClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'bg-accent text-white';
    case 'light':
      return 'bg-accent text-white';
    case 'leve-saude':
      return 'bg-leve-accent text-white';
    case 'auto': {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'bg-accent text-white' : 'bg-accent text-white';
    }
    default:
      return 'bg-accent text-white';
  }
};

/**
 * Retorna classes CSS para o ícone inativo do timeline baseado no tema
 */
export const getInactiveIconClasses = (_theme: Theme): string => {
  return 'bg-surface-hover text-text-secondary';
};

/**
 * Retorna classes CSS para o texto do título baseado no tema e estado
 */
export const getTitleClasses = (_theme: Theme, isActive: boolean): string => {
  const baseClasses =
    'text-md font-medium leading-tight tracking-tight md:text-lg transition-colors duration-200';
  if (isActive) {
    return `${baseClasses} text-text-primary`;
  }
  // Melhor contraste para texto inativo
  return `${baseClasses} text-text-primary/80`;
};

/**
 * Retorna classes CSS para a descrição baseado no tema e estado
 */
export const getDescriptionClasses = (_theme: Theme, isActive: boolean): string => {
  const baseClasses = 'text-xs leading-relaxed md:text-sm transition-all duration-300';
  if (isActive) {
    return `${baseClasses} text-text-secondary line-clamp-none`;
  }
  // Melhor contraste para descrição inativa
  return `${baseClasses} text-text-secondary/90 line-clamp-2`;
};

/**
 * Retorna classes CSS para o container de items baseado no tema
 */
export const getItemsContainerClasses = (theme: Theme): string => {
  switch (theme) {
    case 'dark':
      return 'rounded-lg border border-surface-border bg-surface/70 p-4';
    case 'light':
      return 'rounded-lg border border-surface-border bg-surface/80 p-4';
    case 'leve-saude':
      return 'rounded-lg border border-surface-border bg-surface/80 p-4';
    default:
      return 'rounded-lg border border-surface-border bg-surface/70 p-4';
  }
};
