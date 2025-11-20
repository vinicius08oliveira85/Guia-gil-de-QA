
import React from 'react';

type CardProps = React.HTMLAttributes<HTMLElement> & {
    children: React.ReactNode;
    className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => (
    <section
        className={`card-surface win-card dense-card gap-3 px-3 py-3 sm:px-5 sm:py-5 w-full max-w-full transition-all duration-300 focus-within:ring-2 focus-within:ring-accent/30 mobile-no-overflow ${className}`}
        {...rest}
    >
        {children}
    </section>
);