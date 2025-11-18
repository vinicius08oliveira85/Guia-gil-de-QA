
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    maxHeight?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md',
    maxHeight = '90vh'
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw]'
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div 
                className={`mica rounded-xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col overflow-hidden animate-fade-in max-h-[${maxHeight}]`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight }}
            >
                {/* Title Bar - Fixed */}
                <div className="flex justify-between items-center p-4 bg-white/5 border-b border-surface-border flex-shrink-0">
                    <h2 className="text-lg font-semibold text-text-primary pr-4 truncate">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex justify-center items-center rounded-md text-text-secondary hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                        aria-label="Fechar"
                    >
                        &times;
                    </button>
                </div>
                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: `calc(${maxHeight} - 80px)` }}>
                  {children}
                </div>
            </div>
        </div>
    );
};