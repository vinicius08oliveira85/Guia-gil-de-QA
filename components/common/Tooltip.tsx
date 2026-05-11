import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, Children } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const INTERACTIVE_TYPES = ['button', 'a', 'input', 'select', 'textarea'];

function isInteractiveChild(children: React.ReactNode): boolean {
  const child = Children.only(children) as React.ReactElement | null;
  if (!child) return false;
  const type = typeof child.type === 'string' ? child.type : '';
  return INTERACTIVE_TYPES.includes(type);
}

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  ariaLabel?: string;
  /** Classes no elemento que envolve o gatilho (ex.: `block w-full` para cards em grade). */
  triggerClassName?: string;
}

/**
 * Tooltip em portal (`document.body`) + `position: fixed` com coordenadas da viewport.
 * Evita desvio quando um ancestral tem `transform`/`filter` (ex.: animações Framer Motion),
 * que quebram o referencial de `fixed`.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  disabled = false,
  ariaLabel,
  triggerClassName,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const layoutRetryRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spacing = 8;

    if (tooltipRect.width < 1 || tooltipRect.height < 1) {
      if (layoutRetryRef.current < 12) {
        layoutRetryRef.current += 1;
        requestAnimationFrame(() => updatePosition());
      }
      return;
    }
    layoutRetryRef.current = 0;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        if (top < spacing) {
          top = triggerRect.bottom + spacing;
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        if (top + tooltipRect.height > vh - spacing) {
          top = triggerRect.top - tooltipRect.height - spacing;
        }
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - spacing;
        if (left < spacing) {
          left = triggerRect.right + spacing;
        }
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + spacing;
        if (left + tooltipRect.width > vw - spacing) {
          left = triggerRect.left - tooltipRect.width - spacing;
        }
        break;
      default:
        break;
    }

    left = Math.max(spacing, Math.min(left, vw - tooltipRect.width - spacing));
    top = Math.max(spacing, Math.min(top, vh - tooltipRect.height - spacing));

    setTooltipPosition({ top, left });
  }, [position]);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    layoutRetryRef.current = 0;
    setIsVisible(false);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    void e;
    showTooltip();
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  const handleFocus = (e: React.FocusEvent) => {
    void e;
    showTooltip();
  };

  const handleBlur = () => {
    hideTooltip();
  };

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }

    updatePosition();

    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isVisible, updatePosition, content]);

  const childIsInteractive = isInteractiveChild(children);

  const tooltipLayer =
    mounted && typeof document !== 'undefined' ? (
      createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={tooltipRef}
              role="tooltip"
              className="fixed z-[100] px-3 py-2 text-sm text-tooltip-text rounded-lg shadow-lg pointer-events-none border border-tooltip-border backdrop-blur-sm"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                backgroundColor: 'var(--tooltip-bg)',
                maxWidth: 'min(320px, calc(100vw - 16px))',
              }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )
    ) : null;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={
          !childIsInteractive
            ? ariaLabel || (typeof content === 'string' ? content : undefined)
            : undefined
        }
        tabIndex={disabled || childIsInteractive ? undefined : 0}
        className={cn('inline-flex min-w-0 max-w-full', triggerClassName)}
      >
        {children}
      </span>
      {tooltipLayer}
    </>
  );
};
