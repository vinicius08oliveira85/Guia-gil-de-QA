import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    maxHeight?: string;
}

/**
 * Modal com design Windows 12
 * Suporta diferentes tamanhos e fecha com ESC
 */
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
            className="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6 overflow-y-auto transition-opacity duration-300 bg-slate-950/80 backdrop-blur-xl"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                id="modal-content"
                className={`w-full ${sizeClasses[size]} flex flex-col overflow-hidden animate-fade-in rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-800/98 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(34,211,238,0.1)]`}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                style={{ 
                    maxHeight: `min(${maxHeight}, calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem))`,
                    marginTop: 'max(1rem, env(safe-area-inset-top))',
                    marginBottom: 'max(1rem, env(safe-area-inset-bottom))'
                }}
            >
                {/* Title Bar - Fixed */}
                <div className="relative flex justify-between items-center px-6 py-5 bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-transparent border-b border-cyan-500/10 backdrop-blur-sm flex-shrink-0">
                    <h2 
                        id="modal-title" 
                        className="text-xl font-semibold bg-gradient-to-r from-slate-100 via-cyan-200 to-slate-100 bg-clip-text text-transparent pr-4 truncate text-balance"
                    >
                        {title}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all duration-200 flex items-center justify-center flex-shrink-0 text-xl"
                        aria-label="Fechar modal"
                        aria-describedby="modal-title"
                    >
                        ×
                    </button>
                    
                    {/* Linha de destaque */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                </div>
                
                {/* Content - Scrollable */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1" style={{ maxHeight: `calc(${maxHeight} - 100px)` }}>
                    {children}
                </div>
            </div>
        </div>
    );
};
