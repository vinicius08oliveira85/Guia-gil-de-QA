/**
 * Componente do balão de fala do Rolaf
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { QATip } from '../../utils/rolafTips';

interface RolafTooltipProps {
  tip: QATip;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
  className?: string;
}

/**
 * Calcula posição do tooltip para evitar bordas da tela
 */
function calculateTooltipPosition(
  position: RolafTooltipProps['position'],
  tooltipRef: React.RefObject<HTMLDivElement>,
  avatarRef?: React.RefObject<HTMLDivElement>
): { top?: number; bottom?: number; left?: number; right?: number } {
  if (!tooltipRef.current) return {};

  const tooltipRect = tooltipRef.current.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 16;

  const positions: Record<string, { top?: number; bottom?: number; left?: number; right?: number }> = {
    'bottom-right': {
      bottom: 140, // Acima do avatar
      right: margin
    },
    'bottom-left': {
      bottom: 140,
      left: margin
    },
    'top-right': {
      top: margin,
      right: margin
    },
    'top-left': {
      top: margin,
      left: margin
    }
  };

  let finalPosition = positions[position];

  // Ajusta se tooltip sair da tela
  if (finalPosition.right !== undefined) {
    const rightPos = viewportWidth - (finalPosition.right + tooltipRect.width);
    if (rightPos < margin) {
      finalPosition = { ...finalPosition, right: margin, left: undefined };
    }
  }

  if (finalPosition.left !== undefined) {
    if (finalPosition.left + tooltipRect.width > viewportWidth - margin) {
      finalPosition = { ...finalPosition, left: viewportWidth - tooltipRect.width - margin, right: undefined };
    }
  }

  if (finalPosition.bottom !== undefined) {
    const bottomPos = viewportHeight - (finalPosition.bottom + tooltipRect.height);
    if (bottomPos < margin) {
      finalPosition = { ...finalPosition, bottom: margin, top: undefined };
    }
  }

  if (finalPosition.top !== undefined) {
    if (finalPosition.top + tooltipRect.height > viewportHeight - margin) {
      finalPosition = { ...finalPosition, top: viewportHeight - tooltipRect.height - margin, bottom: undefined };
    }
  }

  return finalPosition;
}

export const RolafTooltip: React.FC<RolafTooltipProps> = ({
  tip,
  position,
  onClose,
  onNext,
  onPrevious,
  showNavigation = false,
  className = ''
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});

  useEffect(() => {
    const updatePosition = () => {
      if (tooltipRef.current) {
        const pos = calculateTooltipPosition(position, tooltipRef);
        setTooltipPosition(pos);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position]);

  const categoryColors = {
    basico: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    metodologias: 'bg-purple-500/10 border-purple-500/30 text-purple-200',
    'boas-praticas': 'bg-green-500/10 border-green-500/30 text-green-200',
    automacao: 'bg-orange-500/10 border-orange-500/30 text-orange-200',
    ferramentas: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200',
    processo: 'bg-pink-500/10 border-pink-500/30 text-pink-200'
  };

  const categoryLabels = {
    basico: 'Básico',
    metodologias: 'Metodologias',
    'boas-praticas': 'Boas Práticas',
    automacao: 'Automação',
    ferramentas: 'Ferramentas',
    processo: 'Processo'
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        className={`fixed z-50 max-w-sm ${className}`}
        style={tooltipPosition}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        role="dialog"
        aria-labelledby="rolaf-tooltip-title"
        aria-describedby="rolaf-tooltip-content"
      >
        <div className={`rounded-xl border-2 p-4 shadow-2xl backdrop-blur-sm ${categoryColors[tip.category] || categoryColors.basico}`}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  {categoryLabels[tip.category] || 'Dica'}
                </span>
                {tip.priority === 'high' && (
                  <span className="text-xs bg-red-500/20 text-red-200 px-1.5 py-0.5 rounded">Importante</span>
                )}
              </div>
              <h3 id="rolaf-tooltip-title" className="text-base font-bold text-base-content line-clamp-2">
                {tip.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-square flex-shrink-0"
              aria-label="Fechar dica"
              type="button"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div id="rolaf-tooltip-content" className="text-sm text-base-content/90 leading-relaxed mb-3">
            {tip.content}
          </div>

          {/* Footer com navegação */}
          <div className="flex items-center justify-between pt-2 border-t border-current/20">
            {showNavigation && (
              <div className="flex items-center gap-2">
                {onPrevious && (
                  <button
                    onClick={onPrevious}
                    className="btn btn-ghost btn-sm btn-square"
                    aria-label="Dica anterior"
                    type="button"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="btn btn-ghost btn-sm btn-square"
                    aria-label="Próxima dica"
                    type="button"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="ml-auto">
              <button
                onClick={onClose}
                className="btn btn-sm btn-ghost"
                type="button"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>

        {/* Seta apontando para o avatar */}
        <div
          className={`absolute w-0 h-0 ${
            position.includes('bottom')
              ? 'bottom-[-8px] border-t-8 border-t-current'
              : 'top-[-8px] border-b-8 border-b-current'
          } ${
            position.includes('right')
              ? 'right-8 border-l-8 border-l-transparent border-r-8 border-r-transparent'
              : 'left-8 border-l-8 border-l-transparent border-r-8 border-r-transparent'
          }`}
          style={{
            borderColor: position.includes('bottom')
              ? `var(--color-${tip.category === 'basico' ? 'blue' : tip.category === 'metodologias' ? 'purple' : tip.category === 'boas-praticas' ? 'green' : tip.category === 'automacao' ? 'orange' : tip.category === 'ferramentas' ? 'yellow' : 'pink'}-500/30) transparent`
              : undefined
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

RolafTooltip.displayName = 'RolafTooltip';

