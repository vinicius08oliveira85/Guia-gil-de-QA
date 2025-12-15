
import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
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
    maxHeight = '95vh'
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

    // Bloquear scroll do body quando modal estiver aberto
    useEffect(() => {
        if (!isOpen) return;
        
        // Salvar o valor original do overflow
        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        
        // Calcular largura da barra de rolagem para evitar shift de layout
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        // Bloquear scroll do body
        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        
        return () => {
            // Restaurar valores originais
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [isOpen]);

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-100/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                id="modal-content"
                className={`w-full ${sizeClasses[size]} flex flex-col overflow-hidden animate-fade-in shadow-2xl border border-base-300 bg-base-100 rounded-[var(--rounded-box)]`}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                style={{ 
                    maxHeight: maxHeight || `calc(100vh - 2rem)`
                }}
            >
                {/* Title Bar - Fixed */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-base-300 flex-shrink-0">
                    <div id="modal-title" className="min-w-0 flex-1">
                        {typeof title === 'string' ? (
                            <h2 className="text-lg sm:text-xl font-semibold text-base-content truncate">
                                {title}
                            </h2>
                        ) : (
                            <div className="text-lg sm:text-xl font-semibold text-base-content">
                                {title}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="btn btn-ghost btn-sm flex-shrink-0"
                        aria-label="Fechar modal"
                        aria-describedby="modal-title"
                        type="button"
                    >
                        &times;
                    </button>
                </div>
                {/* Content - Scrollable */}
                <div className="px-5 py-4 flex-1 overflow-y-auto flex flex-col min-h-0 overscroll-contain">
                  <div className="flex-1 min-h-0">
                    {children}
                  </div>
                </div>
            </div>
        </div>
    );
};