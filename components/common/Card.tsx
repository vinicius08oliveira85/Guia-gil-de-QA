
import React from 'react';

type CardProps = React.HTMLAttributes<HTMLElement> & {
    children: React.ReactNode;
    className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => (
    <section
        className={`card-surface mica rounded-2xl px-4 py-3 sm:px-6 sm:py-5 shadow-lg shadow-black/20 border border-surface-border/60 w-full max-w-full ${className}`}
        {...rest}
    >
        {children}
    </section>
);