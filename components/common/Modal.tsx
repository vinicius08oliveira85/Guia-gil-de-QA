import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { modalOverlayZClass } from '../../utils/layerZIndex';
import {
  leveModalBodyClass,
  leveModalCloseButtonClass,
  leveModalFooterClass,
  leveModalGrabberClass,
  leveModalHeaderClass,
  leveModalOverlayClass,
  leveModalPanelBorderClass,
  leveModalTitleClass,
} from './projectCardUi';

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
  /** Classes extras no painel do modal (borda, fundo, etc.). */
  panelClassName?: string;
  /** Classes extras no título do cabeçalho. */
  titleClassName?: string;
  /** Classes extras na área rolável do corpo. */
  bodyClassName?: string;
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
  panelClassName,
  titleClassName,
  bodyClassName,
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

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
    xl: 'max-w-full sm:max-w-xl sm:min-w-[min(20rem,90vw)]',
    '2xl': 'max-w-full sm:max-w-2xl sm:min-w-[min(24rem,90vw)]',
    '3xl': 'max-w-full sm:max-w-3xl sm:min-w-[min(28rem,90vw)]',
    '4xl': 'max-w-full sm:max-w-4xl sm:min-w-[min(32rem,90vw)]',
    '5xl': 'max-w-full sm:max-w-5xl sm:min-w-[min(36rem,90vw)]',
    '6xl': 'max-w-full sm:max-w-6xl sm:min-w-[min(40rem,90vw)]',
    '7xl': 'max-w-full sm:max-w-7xl sm:min-w-[min(44rem,90vw)]',
    full: 'max-w-none h-screen max-h-full w-full rounded-none',
  };

  const panelBaseClass = cn(
    'relative flex flex-col overflow-hidden font-sans',
    leveModalPanelBorderClass,
    panelClassName
  );

  const modalLayout = (
    <div
      className={
        isFull
          ? cn(
              'neu-overlay fixed inset-0 flex items-stretch justify-stretch p-0 transition-opacity duration-200',
              modalOverlayZClass,
              leveModalOverlayClass
            )
          : cn(
              'neu-overlay fixed inset-0 flex animate-in fade-in items-end justify-center p-0 duration-200 sm:items-center sm:p-3 md:p-5',
              modalOverlayZClass,
              leveModalOverlayClass
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
                panelBaseClass,
                'animate-in fade-in duration-300 ease-out'
              )
            : cn(
                panelBaseClass,
                'max-sm:animate-modal-bottom-sheet-in w-full max-w-full max-sm:max-w-none sm:animate-in sm:fade-in sm:duration-200 sm:zoom-in-95 sm:slide-in-from-bottom-8',
                'rounded-t-[var(--leve-header-radius)] rounded-b-none max-h-[min(96dvh,100svh-env(safe-area-inset-bottom))] min-h-[min(40vh,20rem)] sm:rounded-[var(--leve-header-radius)] sm:max-h-[min(92vh,100dvh-env(safe-area-inset-top)-1.5rem)]',
                sizeClasses[size]
              )
        }
        onClick={e => e.stopPropagation()}
        style={maxHeight && !isFull ? { maxHeight } : undefined}
        tabIndex={-1}
      >
        <div
          className={cn(
            'sticky top-0 z-10 flex flex-shrink-0 flex-col gap-0',
            leveModalHeaderClass,
            isFull ? 'px-3 py-2.5 sm:px-5 sm:py-3.5' : 'px-3 pb-2 pt-1 sm:px-5 sm:pb-3 sm:pt-3.5'
          )}
        >
          {!isFull && (
            <div
              className="mx-auto mb-2 flex h-5 w-full max-w-[120px] shrink-0 items-center justify-center sm:hidden"
              aria-hidden
            >
              <span className={cn('h-1.5 w-11 rounded-full', leveModalGrabberClass)} />
            </div>
          )}
          <div className="flex min-h-[48px] items-start justify-between gap-3 sm:min-h-0 sm:items-center">
            <div
              id={titleId}
              className={cn(
                'min-w-0 flex-1 pr-2 text-lg font-semibold leading-snug text-balance sm:pr-4 sm:text-xl',
                leveModalTitleClass,
                titleClassName
              )}
            >
              {title}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={cn('win-icon-button', leveModalCloseButtonClass)}
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <div
          className={cn(
            'custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-3 py-3 scrollbar-thin scrollbar-track-transparent sm:px-5 sm:py-5',
            leveModalBodyClass,
            bodyClassName
          )}
        >
          {children}
        </div>

        {footer && (
          <div className={cn('flex-shrink-0 px-3 py-2.5 sm:px-4 sm:py-3', leveModalFooterClass)}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalLayout, document.body);
};
