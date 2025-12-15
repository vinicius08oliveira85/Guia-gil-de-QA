import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  ariaLabel?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  disabled = false,
  ariaLabel
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
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

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 8;

    let top = 0;
    let left = 0;

    // Calcular posição base
    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - spacing;
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        // Se sair da tela em cima, mudar para bottom
        if (top < scrollY) {
          top = triggerRect.bottom + scrollY + spacing;
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + spacing;
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        // Se sair da tela embaixo, mudar para top
        if (top + tooltipRect.height > scrollY + viewportHeight) {
          top = triggerRect.top + scrollY - tooltipRect.height - spacing;
        }
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left + scrollX - tooltipRect.width - spacing;
        // Se sair da tela à esquerda, mudar para right
        if (left < scrollX) {
          left = triggerRect.right + scrollX + spacing;
        }
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + scrollX + spacing;
        // Se sair da tela à direita, mudar para left
        if (left + tooltipRect.width > scrollX + viewportWidth) {
          left = triggerRect.left + scrollX - tooltipRect.width - spacing;
        }
        break;
    }

    // Ajustar horizontalmente se sair da tela
    if (left < scrollX) {
      left = scrollX + spacing;
    } else if (left + tooltipRect.width > scrollX + viewportWidth) {
      left = scrollX + viewportWidth - tooltipRect.width - spacing;
    }

    // Ajustar verticalmente se sair da tela
    if (top < scrollY) {
      top = scrollY + spacing;
    } else if (top + tooltipRect.height > scrollY + viewportHeight) {
      top = scrollY + viewportHeight - tooltipRect.height - spacing;
    }

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <>
      {React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        'aria-label': ariaLabel || (typeof content === 'string' ? content : undefined),
        tabIndex: disabled ? undefined : 0
      })}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            role="tooltip"
            className="fixed z-50 px-3 py-2 text-sm text-tooltip-text rounded-lg shadow-lg pointer-events-none border border-tooltip-border backdrop-blur-sm"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              backgroundColor: 'var(--tooltip-bg)',
              maxWidth: '320px'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

