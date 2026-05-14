import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Card reutilizável alinhado ao padrão DaisyUI (modernização UI).
 *
 * @param children - Conteúdo do card
 * @param className - Classes CSS adicionais
 * @param variant - Variante visual do card ('default' | 'elevated' | 'outlined')
 * @param hoverable - Se o card deve ter efeitos de hover
 * @param rest - Props HTML adicionais para o elemento section
 *
 * @example
 * ```tsx
 * <Card className="custom-class" variant="elevated" hoverable>
 *   <h2>Título</h2>
 *   <p>Conteúdo</p>
 * </Card>
 * ```
 */
type CardProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  hoverable?: boolean;
};

export const Card = React.memo<CardProps>(
  ({ children, className = '', variant = 'default', hoverable = true, ...rest }) => {
    const variantClasses = {
      default:
        'app-surface',
      elevated:
        'app-surface app-surface-strong task-card-shadow',
      outlined:
        'border bg-[color-mix(in_srgb,var(--brand-surface)_72%,transparent)] border-[var(--brand-surface-border)] shadow-none',
    };

    const hoverClasses = hoverable
      ? 'transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand-cta)_22%,var(--brand-surface-border))] hover:ring-1 hover:ring-[color-mix(in_srgb,var(--brand-highlight)_16%,transparent)] motion-reduce:transform-none motion-reduce:hover:ring-0'
      : '';

    return (
      <section
        className={cn(
          'w-full max-w-full',
          'text-base-content',
          'rounded-[var(--radius)]',
          'focus-within:ring-2 focus-within:ring-[color-mix(in_oklch,oklch(var(--p))_35%,transparent)] focus-within:ring-offset-0',
          variantClasses[variant],
          hoverClasses,
          className
        )}
        {...rest}
      >
        {children}
      </section>
    );
  }
);

Card.displayName = 'Card';
