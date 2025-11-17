
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        {children}
    </div>
);
