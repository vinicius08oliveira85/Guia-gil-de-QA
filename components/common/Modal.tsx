
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

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw]'
    };

    // Foco no modal quando abrir
    useEffect(() => {
        if (isOpen) {
            const modalElement = document.getElementById('modal-content');
            if (modalElement) {
                modalElement.focus();
            }
        }
    }, [isOpen]);

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                id="modal-content"
                className={`mica rounded-xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col overflow-hidden animate-fade-in`}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                style={{ 
                    maxHeight: `min(${maxHeight}, calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem))`,
                    marginTop: 'max(1rem, env(safe-area-inset-top))',
                    marginBottom: 'max(1rem, env(safe-area-inset-bottom))'
                }}
            >
                {/* Title Bar - Fixed */}
                <div className="flex justify-between items-center p-4 bg-white/5 border-b border-surface-border flex-shrink-0">
                    <h2 id="modal-title" className="text-lg font-semibold text-text-primary pr-4 truncate">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="min-h-[44px] min-w-[44px] flex justify-center items-center rounded-md text-text-secondary hover:bg-red-500 hover:text-white transition-colors flex-shrink-0 active:scale-95 active:opacity-80"
                        aria-label="Fechar modal"
                        aria-describedby="modal-title"
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