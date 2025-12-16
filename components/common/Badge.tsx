import React from 'react';
import { X } from 'lucide-react';
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
  /** Se true, exibe ícone de fechar e permite remoção */
  dismissible?: boolean;
  /** Callback chamado quando o badge é removido */
  onDismiss?: () => void;
}

/**
 * Componente Badge para exibir status, tags ou labels
 * Suporta modo removível (dismissible) com ícone de fechar
 * 
 * @example
 * ```tsx
 * <Badge variant="success" size="sm">Aprovado</Badge>
 * <Badge variant="error" dismissible onDismiss={handleDismiss}>Crítica</Badge>
 * ```
 */
export const Badge = React.memo<BadgeProps>(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dismissible = false,
  onDismiss
}) => {
  // Classes base para variantes (mantém compatibilidade com DaisyUI)
  const variantClasses = {
    default: 'badge-outline',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info'
  };

  // Classes de tamanho
  const sizeClasses = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg'
  };

  // Estilos customizados para badges dismissible seguindo padrão Radix UI
  const dismissibleVariantStyles = {
    default: 'bg-gray-50 border border-gray-300 text-gray-700',
    success: 'bg-green-50 border border-green-500 text-green-700',
    warning: 'bg-yellow-50 border border-yellow-500 text-yellow-700',
    error: 'bg-pink-50 border border-red-500 text-red-700',
    info: 'bg-blue-50 border border-blue-500 text-blue-700'
  };

  // Tamanhos do ícone de fechar
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  // Tamanhos do círculo do ícone (mínimo 44x44px para acessibilidade WCAG)
  const circleSizes = {
    sm: 'h-5 w-5 min-h-[20px] min-w-[20px]', // 20px mínimo, mas preferível maior
    md: 'h-6 w-6 min-h-[24px] min-w-[24px]',
    lg: 'h-7 w-7 min-h-[28px] min-w-[28px]'
  };

  const label = typeof children === 'string' ? children : undefined;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onDismiss?.();
    }
  };

  // Se for dismissible, usa estilos customizados
  if (dismissible) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium whitespace-nowrap',
          'transition-colors hover:opacity-80',
          dismissibleVariantStyles[variant],
          size === 'sm' && 'text-xs px-2 py-0.5',
          size === 'lg' && 'text-sm px-3 py-1.5',
          className
        )}
        aria-label={label}
        role="status"
      >
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex items-center justify-center rounded-full bg-white text-gray-600',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400',
              'transition-colors cursor-pointer',
              circleSizes[size]
            )}
            aria-label={`Remover ${label || 'badge'}`}
            tabIndex={0}
          >
            <X className={cn(iconSizes[size], 'text-current')} aria-hidden="true" />
          </button>
        )}
        <span className="truncate">{children}</span>
      </span>
    );
  }

  // Badge não-dismissible mantém comportamento original
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

