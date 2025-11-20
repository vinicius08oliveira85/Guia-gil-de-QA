
import React from 'react';

type CardProps = React.HTMLAttributes<HTMLElement> & {
    children: React.ReactNode;
    className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => (
    <section
        className={`card-surface win-card px-4 py-4 sm:px-6 sm:py-6 w-full max-w-full transition-all duration-300 focus-within:ring-2 focus-within:ring-accent/30 ${className}`}
        {...rest}
    >
        {children}
    </section>
);