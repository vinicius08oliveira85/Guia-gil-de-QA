import React from 'react';
import { cn } from '../../utils/cn';

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
    default: 'badge-outline',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info'
  };

  const sizeClasses = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg'
  };

  const label = typeof children === 'string' ? children : undefined;

  return (
    <span
      className={cn(
        'badge whitespace-nowrap truncate',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-label={label}
      role="status"
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

