
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`mica rounded-lg p-4 sm:p-6 shadow-lg ${className}`}>
        {children}
    </div>
);