/**
 * Componente de tour interativo do Rolaf
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { RolafAvatar, RolafAvatarState } from './RolafAvatar';
import { RolafTooltip } from './RolafTooltip';
import { QATip } from '../../utils/rolafTips';

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // Seletor CSS do elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right';
  tip?: QATip; // Dica relacionada opcional
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo! 👋',
    content: 'Olá! Eu sou o Rolaf, seu assistente virtual de QA. Vou te guiar pelo aplicativo e dar dicas úteis sobre Quality Assurance.',
    position: 'bottom'
  },
  {
    id: 'dashboard',
    title: 'Dashboard de Projetos',
    content: 'Aqui você vê todos os seus projetos. Crie um novo projeto clicando no botão "Novo Projeto" para começar.',
    target: '[data-tour="create-project"]',
    position: 'bottom'
  },
  {
    id: 'projects',
    title: 'Gerenciando Projetos',
    content: 'Cada projeto contém tarefas, casos de teste, documentos e análises. Selecione um projeto para ver seus detalhes.',
    target: '[data-tour="project-list"]',
    position: 'bottom'
  },
  {
    id: 'tasks',
    title: 'Tarefas e Testes',
    content: 'As tarefas representam funcionalidades ou bugs. Cada tarefa pode ter múltiplos casos de teste para validar o comportamento.',
    target: '[data-tour="tasks-tab"]',
    position: 'bottom'
  },
  {
    id: 'test-cases',
    title: 'Casos de Teste',
    content: 'Crie casos de teste detalhados com passos claros e resultados esperados. Use a IA para gerar sugestões automaticamente!',
    target: '[data-tour="test-cases"]',
    position: 'bottom'
  },
  {
    id: 'metrics',
    title: 'Métricas e Análises',
    content: 'Acompanhe métricas importantes como taxa de sucesso, bugs encontrados e cobertura de testes. Use análises de IA para insights.',
    target: '[data-tour="metrics"]',
    position: 'bottom'
  },
  {
    id: 'complete',
    title: 'Pronto para Começar! 🚀',
    content: 'Agora você conhece o básico! Eu aparecerei de tempos em tempos com dicas sobre QA. Você pode me chamar clicando no meu avatar.',
    position: 'bottom'
  }
];

interface RolafTourProps {
  steps?: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const RolafTour: React.FC<RolafTourProps> = ({
  steps = DEFAULT_TOUR_STEPS,
  onComplete,
  onSkip,
  position = 'bottom-right'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const currentStepData = steps[currentStep];

  // Destaca elemento alvo
  useEffect(() => {
    if (currentStepData?.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Adiciona classe para highlight
        element.classList.add('rolaf-tour-highlight');
        
        return () => {
          element.classList.remove('rolaf-tour-highlight');
        };
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStepData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (highlightedElement) {
      highlightedElement.classList.remove('rolaf-tour-highlight');
    }
    onComplete();
  };

  const handleSkip = () => {
    if (highlightedElement) {
      highlightedElement.classList.remove('rolaf-tour-highlight');
    }
    onSkip();
  };

  // Calcula posição do overlay highlight
  const getHighlightStyle = (): React.CSSProperties => {
    if (!highlightedElement) return { display: 'none' };
    
    const rect = highlightedElement.getBoundingClientRect();
    
    return {
      position: 'fixed',
      top: `${rect.top - 8}px`,
      left: `${rect.left - 8}px`,
      width: `${rect.width + 16}px`,
      height: `${rect.height + 16}px`,
      zIndex: 9999,
      pointerEvents: 'none'
    };
  };

  return (
    <>
      {/* Overlay escuro com buraco no elemento destacado */}
      <AnimatePresence>
        {highlightedElement && (
          <motion.div
            ref={overlayRef}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9997]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleNext}
            role="presentation"
          >
            {/* Highlight do elemento com box-shadow para criar o buraco */}
            <motion.div
              className="absolute border-4 border-primary rounded-lg bg-transparent"
              style={{
                ...getHighlightStyle(),
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rolaf com tooltip */}
      <div className={`fixed ${position === 'bottom-right' ? 'bottom-4 right-4' : position === 'bottom-left' ? 'bottom-4 left-4' : position === 'top-right' ? 'top-4 right-4' : 'top-4 left-4'} z-[9999]`}>
        <div className="flex flex-col items-end gap-4">
          {/* Tooltip do tour */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`bg-base-100 border-2 border-primary rounded-xl p-4 shadow-2xl max-w-sm ${position.includes('right') ? 'mr-0' : 'ml-0'}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <h3 className="text-base font-bold text-base-content">
                      {currentStepData.title}
                    </h3>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="btn btn-ghost btn-sm btn-square flex-shrink-0"
                    aria-label="Pular tour"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="text-sm text-base-content/90 leading-relaxed mb-3">
                  {currentStepData.content}
                </div>

                {/* Progress indicator */}
                <div className="flex gap-1 mb-3">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded ${
                        index <= currentStep
                          ? 'bg-primary'
                          : 'bg-base-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-base-300">
                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <button
                        onClick={handlePrevious}
                        className="btn btn-ghost btn-sm"
                        type="button"
                      >
                        <ChevronLeft size={16} />
                        Anterior
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSkip}
                      className="btn btn-ghost btn-sm"
                      type="button"
                    >
                      Pular
                    </button>
                    <button
                      onClick={handleNext}
                      className="btn btn-primary btn-sm"
                      type="button"
                    >
                      {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Avatar do Rolaf */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <RolafAvatar
              state="talking"
              size="md"
              onClick={handleNext}
            />
          </motion.div>
        </div>
      </div>

      {/* CSS para highlight (adicionado via style tag) */}
      <style>{`
        .rolaf-tour-highlight {
          position: relative;
          z-index: 9999 !important;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
};

RolafTour.displayName = 'RolafTour';

