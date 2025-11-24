
import React from 'react';

type CardProps = React.HTMLAttributes<HTMLElement> & {
    children: React.ReactNode;
    className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => (
    <section
        className={`card-surface win-card dense-card gap-4 px-5 py-5 sm:px-6 sm:py-6 w-full max-w-full transition-all duration-300 focus-within:ring-2 focus-within:ring-accent/30 mobile-no-overflow ${className}`}
        {...rest}
    >
        {children}
    </section>
);