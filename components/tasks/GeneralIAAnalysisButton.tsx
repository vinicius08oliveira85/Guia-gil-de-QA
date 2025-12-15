import React, { useState, useEffect } from 'react';
import { Spinner } from '../common/Spinner';
import { cn } from '../../utils/cn';

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
      type="button"
      onClick={handleClick}
      disabled={isAnalyzing}
      className={cn(
        'relative overflow-hidden px-3 py-2',
        'bg-base-100 border border-base-300 rounded-xl',
        'transition-all',
        isAnalyzing ? 'cursor-wait shadow-lg border-primary/30' : 'group hover:shadow-lg hover:border-primary/30',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {/* Efeito de fundo glow durante análise */}
      {isAnalyzing && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent animate-pulse" />
      )}

      <div className="relative flex items-center gap-2 z-10">
        {/* Ícone de cérebro/chip com animação aprimorada */}
        <div className={`
          relative w-4 h-4 flex items-center justify-center
          transition-all
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
                bg-primary/40 animate-pulse blur-sm
                ${pulsePhase === 0 ? 'scale-100' : ''}
                ${pulsePhase === 1 ? 'scale-110' : ''}
                ${pulsePhase === 2 ? 'scale-120' : ''}
                ${pulsePhase === 3 ? 'scale-110' : ''}
                transition-all duration-300
              `} />
            </>
          ) : (
            <svg 
              className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors" 
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
            text-xs font-semibold leading-tight
            ${isAnalyzing ? 'text-primary' : 'text-base-content'}
            transition-all
          `}>
            {isAnalyzing ? 'Analisando...' : 'Análise IA'}
          </span>
          {isAnalyzing && progress?.message && (
            <span className="text-[10px] text-base-content/70 mt-0.5 animate-pulse leading-tight">
              {progress.message.length > 30 ? `${progress.message.substring(0, 30)}...` : progress.message}
            </span>
          )}
        </div>
      </div>

      {/* Barra de progresso melhorada com gradiente animado */}
      {isAnalyzing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-base-200 rounded-b-xl overflow-hidden">
          <div 
            className={`
              h-full 
              bg-gradient-to-r from-primary via-primary/70 to-primary
              transition-all duration-300
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
          transition-transform duration-500
          bg-gradient-to-r from-transparent via-white/10 to-transparent
          pointer-events-none
        `} />
      )}

      {/* Borda brilhante durante análise */}
      {isAnalyzing && (
        <div className={`
          absolute inset-0 rounded-xl
          border-2 border-primary/20
          animate-pulse
          pointer-events-none
        `} />
      )}
    </button>
  );
};

