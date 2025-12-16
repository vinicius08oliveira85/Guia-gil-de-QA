import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Variantes de status para o badge
 */
export type StatusVariant = 'connected' | 'disconnected' | 'configured' | 'warning';

/**
 * Props do componente StatusBadge
 */
interface StatusBadgeProps {
  /** Variante do status */
  variant: StatusVariant;
  /** Conteúdo do badge */
  children: React.ReactNode;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Estilos para cada variante
 */
const variantStyles: Record<StatusVariant, string> = {
  connected: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20',
  disconnected: 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive-foreground border-destructive/20',
  configured: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
};

/**
 * Estilos para o dot indicador
 */
const dotStyles: Record<StatusVariant, string> = {
  connected: 'bg-emerald-600 dark:bg-emerald-400',
  disconnected: 'bg-destructive dark:bg-destructive-foreground',
  configured: 'bg-blue-600 dark:bg-blue-400',
  warning: 'bg-amber-600 dark:bg-amber-400',
};

/**
 * Labels acessíveis para cada variante
 */
const ariaLabels: Record<StatusVariant, string> = {
  connected: 'Conectado',
  disconnected: 'Desconectado',
  configured: 'Configurado',
  warning: 'Aviso',
};

/**
 * Componente StatusBadge com indicador visual (dot)
 * 
 * Exibe um badge de status com um indicador circular colorido antes do texto.
 * Suporta diferentes variantes semânticas e dark mode.
 * 
 * @example
 * ```tsx
 * <StatusBadge variant="connected">Conectado</StatusBadge>
 * <StatusBadge variant="disconnected">Desconectado</StatusBadge>
 * <StatusBadge variant="configured">Configurado</StatusBadge>
 * ```
 */
export const StatusBadge = React.memo<StatusBadgeProps>(({ variant, children, className }) => {
  const label = typeof children === 'string' ? children : ariaLabels[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
      aria-label={`Status: ${label}`}
      role="status"
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])}
        aria-hidden="true"
      />
      {children}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

