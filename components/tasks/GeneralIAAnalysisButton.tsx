import React, { useState, useEffect } from 'react';
import { Spinner } from '../common/Spinner';
import { windows12Styles } from '../../utils/windows12Styles';

interface GeneralIAAnalysisButtonProps {
  onAnalyze: () => Promise<void>;
  isAnalyzing?: boolean;
  progress?: {
    current: number;
    total: number;
    message: string;
  } | null;
}

export const GeneralIAAnalysisButton: React.FC<GeneralIAAnalysisButtonProps> = ({ 
  onAnalyze, 
  isAnalyzing = false,
  progress = null
}) => {
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Animação de pulso contínua durante análise
  useEffect(() => {
    if (!isAnalyzing) {
      setPulsePhase(0);
      return;
    }

    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 1) % 4);
    }, 600);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleClick = async () => {
    if (isAnalyzing) return;
    
    // Simular progresso durante a análise com feedback mais suave (só se não houver progresso real)
    const progressInterval = setInterval(() => {
      if (!progress) {
        setSimulatedProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          // Progresso mais suave e realista
          const increment = Math.random() * 8 + 2;
          return Math.min(prev + increment, 95);
        });
      }
    }, 400);

    try {
      await onAnalyze();
      // Completar progresso ao finalizar (só se não houver progresso real)
      if (!progress) {
        setSimulatedProgress(100);
        setTimeout(() => setSimulatedProgress(0), 300);
      }
    } finally {
      clearInterval(progressInterval);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isAnalyzing}
      className={`
        relative overflow-hidden
        ${windows12Styles.card}
        ${windows12Styles.transition.normal}
        px-4 py-3
        ${isAnalyzing 
          ? 'cursor-wait shadow-lg shadow-accent/30 border-accent/40' 
          : `${windows12Styles.cardHover} group`
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {/* Efeito de fundo glow durante análise */}
      {isAnalyzing && (
        <div className={`
          absolute inset-0 rounded-xl
          bg-gradient-to-br from-accent/10 via-accent/5 to-transparent
          animate-pulse
          ${windows12Styles.glow('accent')}
        `} />
      )}

      <div className="relative flex items-center gap-3 z-10">
        {/* Ícone de cérebro/chip com animação aprimorada */}
        <div className={`
          relative w-6 h-6 flex items-center justify-center
          ${windows12Styles.transition.normal}
          ${isAnalyzing 
            ? 'animate-spin' 
            : 'group-hover:scale-110 group-hover:rotate-12'
          }
        `}>
          {isAnalyzing ? (
            <>
              <Spinner small />
              {/* Glow pulsante ao redor do spinner */}
              <div className={`
                absolute inset-0 rounded-full
                bg-accent/40 animate-pulse blur-sm
                ${pulsePhase === 0 ? 'scale-100' : ''}
                ${pulsePhase === 1 ? 'scale-110' : ''}
                ${pulsePhase === 2 ? 'scale-120' : ''}
                ${pulsePhase === 3 ? 'scale-110' : ''}
                ${windows12Styles.transition.slow}
              `} />
            </>
          ) : (
            <svg 
              className="w-6 h-6 text-accent-light group-hover:text-accent transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
          )}
        </div>

        <div className="flex flex-col items-start">
          <span className={`
            text-sm font-semibold
            ${isAnalyzing ? 'text-accent-light' : 'text-text-primary'}
            ${windows12Styles.transition.fast}
          `}>
            {isAnalyzing ? 'Analisando...' : 'Análise Geral IA'}
          </span>
          {isAnalyzing && (
            <span className="text-xs text-text-secondary mt-0.5 animate-pulse">
              {progress?.message || 'Processando tarefas e testes...'}
            </span>
          )}
        </div>
      </div>

      {/* Barra de progresso melhorada com gradiente animado */}
      {isAnalyzing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-hover/50 rounded-b-xl overflow-hidden">
          <div 
            className={`
              h-full 
              bg-gradient-to-r from-accent via-accent-light to-accent
              ${windows12Styles.transition.slow}
              relative
            `}
            style={{ 
              width: progress && progress.total > 0 
                ? `${(progress.current / progress.total) * 100}%` 
                : `${simulatedProgress}%` 
            }}
          >
            {/* Efeito shimmer na barra de progresso */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>
        </div>
      )}

      {/* Efeito shimmer aprimorado durante hover (não durante análise) */}
      {!isAnalyzing && (
        <div className={`
          absolute inset-0 
          -translate-x-full group-hover:translate-x-full 
          ${windows12Styles.transition.slow}
          bg-gradient-to-r from-transparent via-white/10 to-transparent
          pointer-events-none
        `} />
      )}

      {/* Borda brilhante durante análise */}
      {isAnalyzing && (
        <div className={`
          absolute inset-0 rounded-xl
          border-2 border-accent/30
          animate-pulse
          pointer-events-none
        `} />
      )}
    </button>
  );
};

