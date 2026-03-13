
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
    maxHeight?: string;
    /** Ref do elemento que abriu o modal; o foco será restaurado a ele ao fechar. */
    triggerRef?: React.RefObject<HTMLElement | null>;
    /** ID do elemento que descreve o modal (aria-describedby). */
    ariaDescribedBy?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    footer,
    maxHeight,
    triggerRef,
    ariaDescribedBy,
}) => {
    const previousActiveElementRef = useRef<HTMLElement | null>(null);

    const handleClose = () => {
        onClose();
        const toFocus = triggerRef?.current ?? previousActiveElementRef.current;
        if (toFocus && typeof toFocus.focus === 'function') {
            requestAnimationFrame(() => toFocus.focus());
        }
    };

    // ESC handler
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Scroll Lock
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [isOpen]);

    // Focus: save previous, focus modal, trap Tab
    useEffect(() => {
        if (!isOpen) return;
        previousActiveElementRef.current = document.activeElement as HTMLElement | null;
        const content = document.getElementById('modal-content');
        requestAnimationFrame(() => content?.focus());

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const contentEl = document.getElementById('modal-content');
            if (!contentEl || !contentEl.contains(document.activeElement)) return;
            const focusables = contentEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            const list = Array.from(focusables).filter((el) => !el.hasAttribute('disabled') && el.offsetParent != null);
            if (list.length === 0) return;
            const first = list[0];
            const last = list[list.length - 1];
            const currentIndex = list.indexOf(document.activeElement as HTMLElement);
            if (e.shiftKey) {
                if (document.activeElement === first || currentIndex === -1) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last || currentIndex === -1) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl',
        '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl', '6xl': 'max-w-6xl', '7xl': 'max-w-7xl',
        full: 'max-w-none w-full h-screen max-h-full',
    };

    const modalLayout = (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${size === 'full' ? 'p-0' : 'p-4 sm:p-6'}`}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby={ariaDescribedBy ?? undefined}
        >
            <div
                id="modal-content"
                className={`bg-base-100 shadow-2xl border border-base-300 relative w-full flex flex-col overflow-hidden ${size === 'full' ? 'rounded-none max-h-full' : 'rounded-2xl max-h-[90vh]'} ${sizeClasses[size]} duration-300 ease-out animate-in fade-in zoom-in-95 slide-in-from-bottom-8`}
                onClick={(e) => e.stopPropagation()}
                style={maxHeight && size !== 'full' ? { maxHeight } : undefined}
                tabIndex={-1}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost z-10"
                    aria-label="Fechar modal"
                >
                    <X size={20} />
                </button>

                {/* Header (sticky no scroll para mobile) */}
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-6 border-b border-base-200 flex-shrink-0 bg-base-100">
                    <div id="modal-title" className="min-w-0 flex-1 pr-8 text-lg sm:text-xl font-semibold text-base-content">
                        {title}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-colors">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-4 border-t border-base-200 bg-base-100/50 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalLayout, document.body);
};