import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const reactId = useId();
  const contentId = `${reactId}-modal-content`;
  const titleId = `${reactId}-modal-title`;

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
    const content = document.getElementById(contentId);
    requestAnimationFrame(() => content?.focus());

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const contentEl = document.getElementById(contentId);
      if (!contentEl || !contentEl.contains(document.activeElement)) return;
      const focusables = contentEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const list = Array.from(focusables).filter(
        el => !el.hasAttribute('disabled') && el.offsetParent != null
      );
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
  }, [isOpen, contentId]);

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

  const overlayTint = 'bg-[color-mix(in_srgb,var(--foreground)_18%,transparent)]';

  const modalLayout = (
    <div
      className={
        isFull
          ? cn(
              'fixed inset-0 z-[9999] flex items-stretch justify-stretch p-0 backdrop-blur-md transition-opacity duration-200',
              overlayTint
            )
          : cn(
              'fixed inset-0 z-[9999] flex items-end justify-center p-0 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4 md:p-6',
              overlayTint
            )
      }
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy ?? undefined}
    >
      <div
        id={contentId}
        className={
          isFull
            ? cn(
                sizeClasses.full,
                'mica !rounded-none relative flex flex-col overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] duration-300 ease-out animate-in fade-in'
              )
            : cn(
                'mica relative flex w-full max-w-full flex-col overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] max-sm:max-w-none max-sm:animate-modal-bottom-sheet-in sm:animate-in sm:fade-in sm:duration-200 sm:zoom-in-95 sm:slide-in-from-bottom-8',
                'rounded-t-[var(--radius)] rounded-b-none max-h-[min(92dvh,100svh-env(safe-area-inset-bottom))] sm:rounded-[var(--radius)] sm:max-h-[min(90vh,100dvh-env(safe-area-inset-top)-2rem)]',
                sizeClasses[size]
              )
        }
        onClick={e => e.stopPropagation()}
        style={maxHeight && !isFull ? { maxHeight } : undefined}
        tabIndex={-1}
      >
        {/* Cabeçalho: em mobile estilo bottom sheet com grabber; sticky + mica */}
        <div
          className={
            isFull
              ? 'sticky top-0 z-10 flex flex-shrink-0 flex-col gap-0 border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 py-3 backdrop-blur-md sm:px-5 sm:py-4'
              : 'sticky top-0 z-10 flex flex-shrink-0 flex-col gap-0 border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-3 pb-3 pt-1 backdrop-blur-md transition-all duration-200 sm:px-5 sm:pb-4 sm:pt-4'
          }
        >
          {!isFull && (
            <div
              className="mx-auto mb-2 flex h-5 w-full max-w-[120px] shrink-0 items-center justify-center sm:hidden"
              aria-hidden
            >
              <span className="h-1.5 w-11 rounded-full bg-[color-mix(in_srgb,var(--foreground)_18%,transparent)]" />
            </div>
          )}
          <div className="flex min-h-[48px] items-start justify-between gap-3 sm:min-h-0 sm:items-center">
            <div
              id={titleId}
              className="min-w-0 flex-1 pr-2 text-lg font-semibold leading-snug text-balance text-[var(--foreground)] sm:pr-4 sm:text-xl [font-family:var(--font-sans)] tracking-[var(--letter-spacing)]"
            >
              {title}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="win-icon-button text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]"
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-3 py-4 text-[var(--foreground)] scrollbar-thin scrollbar-thumb-[color-mix(in_oklch,oklch(var(--p))_35%,transparent)] scrollbar-track-transparent hover:scrollbar-thumb-[color-mix(in_oklch,oklch(var(--p))_50%,transparent)] sm:px-6 sm:py-6 [font-family:var(--font-sans)] tracking-[var(--letter-spacing)]">
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--background)_90%,transparent)] px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4 [&_.btn-primary]:rounded-[var(--radius)] [&_button.btn]:rounded-[var(--radius)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalLayout, document.body);
};
