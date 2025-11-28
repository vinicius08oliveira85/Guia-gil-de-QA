import React from 'react';

/**
 * Componente Card reutilizável com estilo Windows 12
 * 
 * @param children - Conteúdo do card
 * @param className - Classes CSS adicionais
 * @param rest - Props HTML adicionais para o elemento section
 * 
 * @example
 * ```tsx
 * <Card className="custom-class">
 *   <h2>Título</h2>
 *   <p>Conteúdo</p>
 * </Card>
 * ```
 */
type CardProps = React.HTMLAttributes<HTMLElement> & {
    children: React.ReactNode;
    className?: string;
};

export const Card = React.memo<CardProps>(({ children, className = '', ...rest }) => (
    <section
        className={`card-surface win-card dense-card gap-md p-card w-full max-w-full transition-all duration-300 focus-within:ring-2 focus-within:ring-accent/30 mobile-no-overflow ${className}`}
        role="region"
        aria-label="Card container"
        {...rest}
    >
        {children}
    </section>
));

Card.displayName = 'Card';