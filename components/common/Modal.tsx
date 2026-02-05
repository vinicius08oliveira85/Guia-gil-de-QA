
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md',
    footer
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
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                id="modal-content"
                className={`bg-base-100 rounded-2xl shadow-2xl border border-base-300 relative w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in ${sizeClasses[size]}`}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost z-10"
                    aria-label="Fechar modal"
                >
                    <X size={20} />
                </button>

                {/* Title Bar - Fixed */}
                <div className="flex items-center justify-between gap-3 p-6 border-b border-base-200 flex-shrink-0">
                    <div id="modal-title" className="min-w-0 flex-1 pr-8"> {/* pr-8 to avoid overlap with close button */}
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
                </div>
                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6">
                    {children}
                </div>
                {/* Footer - Fixed */}
                {footer && (
                    <div className="p-4 border-t border-base-200 bg-base-100/50 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};