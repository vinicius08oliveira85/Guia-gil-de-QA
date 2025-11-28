
import React, { useEffect, useRef } from 'react';

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
    const scrollPositionRef = useRef<number>(0);

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

    // Desabilitar scroll do body quando modal abrir
    useEffect(() => {
        if (isOpen) {
            // Salvar posição atual do scroll
            scrollPositionRef.current = window.scrollY;
            // Desabilitar scroll
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollPositionRef.current}px`;
            document.body.style.width = '100%';
        } else {
            // Reabilitar scroll
            const scrollY = scrollPositionRef.current;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            // Restaurar posição do scroll
            window.scrollTo(0, scrollY);
        }
        
        return () => {
            // Cleanup: garantir que o scroll seja reabilitado ao desmontar
            if (isOpen) {
                const scrollY = scrollPositionRef.current;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, scrollY);
            }
        };
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
            className="glass-overlay fixed inset-0 z-50 flex justify-center items-start pt-4 sm:pt-6 px-4 sm:px-6 transition-opacity duration-300"
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
                    maxHeight: `calc(100vh - 2rem)`
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
                {/* Content - No scroll */}
                <div className="p-card flex-1 overflow-hidden flex flex-col min-h-0">
                  {children}
                </div>
            </div>
        </div>
    );
};