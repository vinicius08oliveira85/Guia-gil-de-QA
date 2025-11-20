
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`mica rounded-2xl p-3 sm:p-5 lg:p-6 shadow-lg shadow-black/30 border border-surface-border/60 w-full max-w-full ${className}`}>
        {children}
    </div>
);