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
  variant?:
    | 'default'
    | 'neutral'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'success'
    | 'warning'
    | 'error'
    | 'info';
  /** Tamanho do badge */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Aparência: default (DaisyUI) ou pill (arredondada, cores sólidas estilo v0) */
  appearance?: 'default' | 'pill';
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
export const Badge = React.memo<BadgeProps>(
  ({
    children,
    variant = 'default',
    size = 'md',
    appearance = 'default',
    className = '',
    dismissible = false,
    onDismiss,
  }) => {
    // Pill (v0): fundo sólido + texto em contraste, apenas Tailwind
    const pillVariantClasses = {
      neutral: 'bg-neutral text-neutral-content',
      primary: 'bg-primary text-primary-content',
      secondary: 'bg-secondary text-secondary-content',
      accent: 'bg-accent text-accent-content',
      error: 'bg-red-600 text-white',
      warning: 'bg-amber-500 text-white',
      info: 'bg-blue-600 text-white',
      success: 'bg-green-600 text-white',
      default: 'bg-base-200 text-base-content border border-base-300',
    };
    const pillSizeClasses = {
      xs: 'px-2 py-0.5 text-[10px]',
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    // Classes base para variantes (mantém compatibilidade com DaisyUI)
    const variantClasses = {
      default: 'badge-outline',
      neutral: 'badge-neutral',
      primary: 'badge-primary',
      secondary: 'badge-secondary',
      accent: 'badge-accent',
      success: 'badge-success',
      warning: 'badge-warning',
      error: 'badge-error',
      info: 'badge-info',
    };

    // Classes de tamanho
    const sizeClasses = {
      xs: 'badge-xs',
      sm: 'badge-sm',
      md: 'badge-md',
      lg: 'badge-lg',
    };

    // Estilos customizados para badges dismissible seguindo padrão Radix UI
    const dismissibleVariantStyles = {
      default: 'bg-gray-50 border border-gray-300 text-gray-700',
      neutral: 'bg-base-200 border border-base-300 text-base-content',
      primary: 'bg-primary/10 border border-primary text-primary',
      secondary: 'bg-secondary/10 border border-secondary text-secondary',
      accent: 'bg-accent/10 border border-accent text-accent',
      success: 'bg-green-50 border border-green-500 text-green-700',
      warning: 'bg-yellow-50 border border-yellow-500 text-yellow-700',
      error: 'bg-pink-50 border border-red-500 text-red-700',
      info: 'bg-blue-50 border border-blue-500 text-blue-700',
    };

    // Dismissible + pill: cores sólidas do pill
    const dismissiblePillStyles = {
      default: 'bg-gray-200 text-gray-800 border border-gray-300',
      neutral: 'bg-neutral text-neutral-content',
      primary: 'bg-primary text-primary-content',
      secondary: 'bg-secondary text-secondary-content',
      accent: 'bg-accent text-accent-content',
      success: 'bg-green-600 text-white',
      warning: 'bg-amber-500 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-blue-600 text-white',
    };

    // Tamanhos do ícone de fechar
    const iconSizes = {
      xs: 'h-2.5 w-2.5',
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    };

    // Tamanhos do círculo do ícone (mínimo 44x44px para acessibilidade WCAG)
    const circleSizes = {
      xs: 'h-4 w-4 min-h-[16px] min-w-[16px]',
      sm: 'h-5 w-5 min-h-[20px] min-w-[20px]', // 20px mínimo, mas preferível maior
      md: 'h-6 w-6 min-h-[24px] min-w-[24px]',
      lg: 'h-7 w-7 min-h-[28px] min-w-[28px]',
    };

    const label = typeof children === 'string' ? children : undefined;
    const displayContent =
      typeof children === 'string'
        ? children.charAt(0).toUpperCase() + children.slice(1).toLowerCase()
        : children;

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
      const dismissStyles =
        appearance === 'pill' ? dismissiblePillStyles[variant] : dismissibleVariantStyles[variant];
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-bold tracking-wider whitespace-nowrap',
            'transition-colors hover:opacity-80',
            appearance === 'pill'
              ? cn(pillSizeClasses[size], dismissStyles)
              : cn(
                  'px-2.5 py-1 font-medium',
                  dismissStyles,
                  size === 'sm' && 'text-xs px-2 py-0.5',
                  size === 'lg' && 'text-sm px-3 py-1.5'
                ),
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
          <span className="truncate">{displayContent}</span>
        </span>
      );
    }

    // Pill: apenas Tailwind, formato arredondado e cores sólidas (v0)
    if (appearance === 'pill') {
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full font-bold tracking-wider whitespace-nowrap shrink-0',
            pillSizeClasses[size],
            pillVariantClasses[variant],
            className
          )}
          aria-label={label}
          role="status"
        >
          {displayContent}
        </span>
      );
    }

    // Badge não-dismissible mantém comportamento original (DaisyUI)
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
        {displayContent}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
