import React from 'react';

/**
 * Props do componente Badge
 */
interface BadgeProps {
  /** Conteúdo do badge */
  children: React.ReactNode;
  /** Variante visual do badge */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente Badge para exibir status, tags ou labels
 * 
 * @example
 * ```tsx
 * <Badge variant="success" size="sm">Aprovado</Badge>
 * <Badge variant="error">Erro</Badge>
 * ```
 */
export const Badge = React.memo<BadgeProps>(({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variantClasses = {
    default: 'bg-white/5 dark:bg-white/5 text-text-secondary dark:text-text-secondary border-white/10 dark:border-white/10',
    success: 'bg-emerald-500/30 text-emerald-700 dark:bg-success/15 dark:text-success font-semibold border-emerald-500/50 dark:border-success/30',
    warning: 'bg-amber-500/30 text-amber-700 dark:bg-warning/15 dark:text-amber-400 font-semibold border-amber-500/50 dark:border-warning/30',
    error: 'bg-red-500/30 text-red-700 dark:bg-danger/15 dark:text-danger font-semibold border-red-500/50 dark:border-danger/30',
    info: 'bg-blue-500/30 text-blue-700 dark:bg-info/15 dark:text-info font-semibold border-blue-500/50 dark:border-info/30'
  };

  const sizeClasses = {
    sm: 'chip-compact text-[0.68rem]',
    md: 'h-7 px-2 text-[0.72rem]',
    lg: 'h-8 px-3 text-[0.8rem]'
  };

  const label = typeof children === 'string' ? children : undefined;

  return (
    <span
      className={`badge-chip whitespace-nowrap truncate font-semibold transition-transform duration-200 hover:scale-105 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={label}
      role="status"
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

