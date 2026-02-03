import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Componente Card reutilizável com estilo Windows 12 melhorado
 * Inclui glassmorphism, hover effects e animações suaves
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

export const Card = React.memo<CardProps>(({ 
    children, 
    className = '', 
    variant = 'default',
    hoverable = true,
    ...rest 
}) => {
    const variantClasses = {
        default: 'border border-base-200 bg-base-100 shadow-sm',
        elevated: 'border border-base-200 bg-base-100 shadow-xl shadow-base-300/20',
        outlined: 'border border-base-300 bg-transparent shadow-none',
    };

    const hoverClasses = hoverable 
        ? 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/30 hover:border-primary/20' 
        : '';

    return (
        <section
            className={cn(
                'w-full max-w-full',
                'bg-base-100 text-base-content',
                'rounded-2xl', // Mais moderno que rounded-box padrão
                'focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-0',
                variantClasses[variant],
                hoverClasses,
                className
            )}
            {...rest}
        >
            {children}
        </section>
    );
});

Card.displayName = 'Card';