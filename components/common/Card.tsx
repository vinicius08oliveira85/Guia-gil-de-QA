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
        'border border-base-300 bg-base-200 soft-shadow dark:border-base-300/60 dark:bg-base-200/50',
      elevated:
        'border border-base-300 bg-base-200 task-card-shadow dark:border-base-300/60 dark:bg-base-200/50',
      outlined: 'border border-base-300 bg-transparent shadow-none',
    };

    const hoverClasses = hoverable
      ? 'transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,oklch(var(--p))_35%,transparent)] hover:ring-1 hover:ring-[color-mix(in_oklch,oklch(var(--p))_22%,transparent)] motion-reduce:transform-none motion-reduce:hover:ring-0'
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
