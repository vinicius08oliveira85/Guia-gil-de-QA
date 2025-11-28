
import React, { useEffect } from 'react';

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
    // Fechar com ESC
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Foco no modal quando abrir
    useEffect(() => {
        if (!isOpen) return;
        const modalElement = document.getElementById('modal-content');
        if (modalElement) {
            modalElement.focus();
        }
    }, [isOpen]);

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
            className="glass-overlay fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6 overflow-y-auto transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                id="modal-content"
                className={`mica w-full ${sizeClasses[size]} flex flex-col overflow-hidden animate-fade-in shadow-[0_35px_120px_rgba(3,7,23,0.65)]`}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                style={{ 
                    maxHeight: `min(${maxHeight}, calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem))`,
                    marginTop: 'max(1rem, env(safe-area-inset-top))',
                    marginBottom: 'max(1rem, env(safe-area-inset-bottom))'
                }}
            >
                {/* Title Bar - Fixed */}
                <div className="flex justify-between items-center p-card bg-white/5 border-b border-white/10 backdrop-blur-sm flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-semibold text-text-primary pr-4 truncate text-balance">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="win-icon-button text-text-secondary hover:text-white flex-shrink-0"
                        aria-label="Fechar modal"
                        aria-describedby="modal-title"
                    >
                        &times;
                    </button>
                </div>
                {/* Content - Scrollable */}
                <div className="p-card overflow-y-auto flex-1" style={{ maxHeight: `calc(${maxHeight} - 100px)` }}>
                  {children}
                </div>
            </div>
        </div>
    );
};