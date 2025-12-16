/**
 * Componente do balão de fala do Rolaf
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Lightbulb, Info, BookOpen, Settings, Zap } from 'lucide-react';
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

  // Configuração de categorias com fundos sólidos e alto contraste (inspirado v0)
  const categoryConfig = {
    basico: {
      label: 'Básico',
      icon: BookOpen,
      badgeClass: 'bg-blue-100 text-blue-900 border border-blue-200',
      iconClass: 'text-blue-600'
    },
    metodologias: {
      label: 'Metodologias',
      icon: Settings,
      badgeClass: 'bg-purple-100 text-purple-900 border border-purple-200',
      iconClass: 'text-purple-600'
    },
    'boas-praticas': {
      label: 'Boas Práticas',
      icon: CheckCircle,
      badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
      iconClass: 'text-emerald-600'
    },
    automacao: {
      label: 'Automação',
      icon: Zap,
      badgeClass: 'bg-orange-100 text-orange-900 border border-orange-200',
      iconClass: 'text-orange-600'
    },
    ferramentas: {
      label: 'Ferramentas',
      icon: Lightbulb,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200',
      iconClass: 'text-amber-600'
    },
    processo: {
      label: 'Processo',
      icon: Info,
      badgeClass: 'bg-pink-100 text-pink-900 border border-pink-200',
      iconClass: 'text-pink-600'
    }
  };

  const currentCategory = categoryConfig[tip.category] || categoryConfig.basico;
  const CategoryIcon = currentCategory.icon;

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
        {/* Container principal com fundo sólido branco para alto contraste */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* Badge com fundo sólido e ícone */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentCategory.badgeClass}`}>
                  <CategoryIcon className={`h-3.5 w-3.5 ${currentCategory.iconClass}`} />
                  <span>{currentCategory.label}</span>
                </div>
                {tip.priority === 'high' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-200">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Importante</span>
                  </div>
                )}
              </div>
              <h3 id="rolaf-tooltip-title" className="text-base font-bold text-slate-900 line-clamp-2">
                {tip.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 p-1 rounded hover:bg-slate-100"
              aria-label="Fechar dica"
              type="button"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content com texto escuro para alto contraste */}
          <div id="rolaf-tooltip-content" className="text-sm text-slate-700 leading-relaxed mb-3">
            {tip.content}
          </div>

          {/* Footer com navegação */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
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
                className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                type="button"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>

        {/* Seta apontando para o avatar - usando cor sólida branca */}
        <div
          className={`absolute w-0 h-0 ${
            position.includes('bottom')
              ? 'bottom-[-8px] border-t-8 border-t-white'
              : 'top-[-8px] border-b-8 border-b-white'
          } ${
            position.includes('right')
              ? 'right-8 border-l-8 border-l-transparent border-r-8 border-r-transparent'
              : 'left-8 border-l-8 border-l-transparent border-r-8 border-r-transparent'
          }`}
        />
      </motion.div>
    </AnimatePresence>
  );
};

RolafTooltip.displayName = 'RolafTooltip';

