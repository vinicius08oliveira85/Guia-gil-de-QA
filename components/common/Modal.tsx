
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
            className="glass-overlay fixed inset-0 z-50 flex justify-center items-center py-2 sm:py-4 px-4 sm:px-6 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                id="modal-content"
                className={`mica w-full ${sizeClasses[size]} flex flex-col overflow-hidden animate-fade-in shadow-[0_35px_120px_rgba(3,7,23,0.65)] rounded-lg`}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                style={{ 
                    maxHeight: maxHeight || `calc(100vh - 2rem)`
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
                <div className="p-card flex-1 overflow-y-auto flex flex-col min-h-0 overscroll-contain">
                  <div className="flex-1 min-h-0">
                    {children}
                  </div>
                </div>
            </div>
        </div>
    );
};