
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
                    ? 'fixed inset-0 z-[9999] flex items-stretch justify-stretch bg-base-content/40 backdrop-blur-md transition-opacity duration-200 p-0'
                    : 'fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6 bg-base-content/40 backdrop-blur-md animate-in fade-in duration-200'
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
                        : `bg-base-100/95 shadow-2xl border border-base-300 relative flex flex-col overflow-hidden rounded-t-2xl rounded-b-none max-h-[min(92dvh,100svh)] sm:rounded-2xl sm:rounded-b-2xl sm:max-h-[90vh] w-full max-sm:w-full max-sm:max-w-none ${sizeClasses[size]} max-sm:animate-modal-bottom-sheet-in sm:animate-in sm:fade-in sm:duration-200 sm:zoom-in-95 sm:slide-in-from-bottom-8 max-sm:backdrop-blur-md`
                }
                onClick={(e) => e.stopPropagation()}
                style={maxHeight && !isFull ? { maxHeight } : undefined}
                tabIndex={-1}
            >
                {/* Cabeçalho: em mobile estilo bottom sheet com grabber; sticky + mica */}
                <div
                    className={
                        isFull
                            ? 'sticky top-0 z-10 flex flex-shrink-0 flex-col gap-0 border-b border-base-200/50 bg-base-100/70 px-4 py-3 backdrop-blur-md sm:px-5 sm:py-4'
                            : 'sticky top-0 z-10 flex flex-shrink-0 flex-col gap-0 border-b border-base-200/50 bg-base-100/70 px-3 pb-3 pt-1 backdrop-blur-md transition-all duration-200 sm:px-5 sm:pb-4 sm:pt-4'
                    }
                >
                    {!isFull && (
                        <div
                            className="mx-auto mb-2 flex h-5 w-full max-w-[120px] shrink-0 items-center justify-center sm:hidden"
                            aria-hidden
                        >
                            <span className="h-1.5 w-11 rounded-full bg-base-content/20" />
                        </div>
                    )}
                    <div className="flex min-h-[48px] items-start justify-between gap-3 sm:min-h-0 sm:items-center">
                        <div
                            id="modal-title"
                            className="min-w-0 flex-1 pr-2 font-heading text-lg font-semibold leading-snug tracking-tight text-base-content text-balance sm:pr-4 sm:text-xl"
                        >
                            {title}
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-transparent text-base-content/80 transition-all duration-200 hover:bg-base-200/90 hover:text-base-content active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]"
                            aria-label="Fechar modal"
                        >
                            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </button>
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-3 py-4 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 sm:px-6 sm:py-6">
                    {children}
                </div>

                {footer && (
                    <div className="flex-shrink-0 border-t border-base-200/80 bg-base-100/90 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4 [&_.btn-primary]:rounded-full [&_button.btn]:rounded-full">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalLayout, document.body);
};
