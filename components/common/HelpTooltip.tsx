import React, { useState } from 'react';
import { Tooltip } from './Tooltip';

interface HelpTooltipProps {
    content: string;
    title?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    children?: React.ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
    content, 
    title, 
    position = 'top',
    children 
}) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span 
            className="inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children || (
                <button
                    type="button"
                    className="ml-1 text-accent hover:text-accent-hover transition-colors"
                    aria-label="Ajuda"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </button>
            )}
            {isVisible && (
                <Tooltip position={position}>
                    {title && <div className="font-bold text-white mb-1">{title}</div>}
                    <div className="text-sm text-gray-200 whitespace-pre-line max-w-xs">
                        {content}
                    </div>
                </Tooltip>
            )}
        </span>
    );
};

