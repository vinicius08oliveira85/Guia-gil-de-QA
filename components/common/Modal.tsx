
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

    const isFull = size === 'full';

    /** Mobile: largura total + bottom-sheet; desktop: max-width centralizado. */
    const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
        sm: 'max-w-full sm:max-w-sm',
        md: 'max-w-full sm:max-w-md',
        lg: 'max-w-full sm:max-w-lg',
        xl: 'max-w-full sm:max-w-xl',
        '2xl': 'max-w-full sm:max-w-2xl',
        '3xl': 'max-w-full sm:max-w-3xl',
        '4xl': 'max-w-full sm:max-w-4xl',
        '5xl': 'max-w-full sm:max-w-5xl',
        '6xl': 'max-w-full sm:max-w-6xl',
        '7xl': 'max-w-full sm:max-w-7xl',
        full: 'max-w-none w-full h-screen max-h-full rounded-none',
    };

    const modalLayout = (
        <div
            className={
                isFull
                    ? 'fixed inset-0 z-[9999] flex items-stretch justify-stretch bg-black/60 backdrop-blur-sm transition-opacity duration-200 p-0'
                    : 'fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'
            }
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby={ariaDescribedBy ?? undefined}
        >
            <div
                id="modal-content"
                className={
                    isFull
                        ? `${sizeClasses.full} bg-base-100 shadow-2xl border border-base-300 relative flex flex-col overflow-hidden duration-300 ease-out animate-in fade-in`
                        : `bg-base-100 shadow-2xl border border-base-300 relative flex flex-col overflow-hidden rounded-t-2xl rounded-b-none max-h-[min(92dvh,100svh)] sm:rounded-2xl sm:rounded-b-2xl sm:max-h-[90vh] w-full max-sm:w-full max-sm:max-w-none ${sizeClasses[size]} max-sm:animate-modal-bottom-sheet-in sm:animate-in sm:fade-in sm:duration-200 sm:zoom-in-95 sm:slide-in-from-bottom-8`
                }
                onClick={(e) => e.stopPropagation()}
                style={maxHeight && !isFull ? { maxHeight } : undefined}
                tabIndex={-1}
            >
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 btn btn-ghost btn-circle btn-sm z-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                    aria-label="Fechar modal"
                >
                    <X size={20} />
                </button>

                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5 border-b border-base-200 flex-shrink-0 bg-base-100">
                    <div
                        id="modal-title"
                        className="min-w-0 flex-1 pr-10 sm:pr-12 text-lg sm:text-xl font-semibold text-base-content text-balance"
                    >
                        {title}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-6 custom-scrollbar scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-colors">
                    {children}
                </div>

                {footer && (
                    <div className="px-3 py-3 sm:px-4 sm:py-4 border-t border-base-200 bg-base-100/50 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalLayout, document.body);
};