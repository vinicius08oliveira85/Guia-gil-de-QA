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
    default: 'bg-white/5 text-text-secondary border-white/10',
    success: 'bg-success/15 text-success font-semibold border-success/30',
    warning: 'bg-warning/15 text-warning-dark border-warning/30',
    error: 'bg-danger/15 text-danger border-danger/30',
    info: 'bg-info/15 text-info border-info/30'
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

