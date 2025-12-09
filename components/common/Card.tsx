import React from 'react';
import { cn } from '../../utils/windows12Styles';

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
        default: 'card-surface',
        elevated: 'card-surface shadow-lg shadow-black/20',
        outlined: 'card-surface border-2 border-surface-border',
    };

    const hoverClasses = hoverable 
        ? 'hover:shadow-xl hover:shadow-black/30 hover:border-accent/20 hover:scale-[1.01] transition-all duration-300 ease-out' 
        : '';

    return (
        <section
            className={cn(
                'win-card dense-card gap-sm p-card w-full max-w-full',
                'focus-within:ring-2 focus-within:ring-accent/30',
                'mobile-no-overflow',
                'backdrop-blur-sm',
                variantClasses[variant],
                hoverClasses,
                className
            )}
            role="region"
            aria-label="Card container"
            {...rest}
        >
            {children}
        </section>
    );
});

Card.displayName = 'Card';