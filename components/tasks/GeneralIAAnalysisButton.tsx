import React, { useState } from 'react';
import { Spinner } from '../common/Spinner';

interface GeneralIAAnalysisButtonProps {
  onAnalyze: () => Promise<void>;
  isAnalyzing?: boolean;
}

export const GeneralIAAnalysisButton: React.FC<GeneralIAAnalysisButtonProps> = ({ 
  onAnalyze, 
  isAnalyzing = false 
}) => {
  const [progress, setProgress] = useState(0);

  const handleClick = async () => {
    if (isAnalyzing) return;
    
    // Simular progresso durante a análise
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      await onAnalyze();
    } finally {
      clearInterval(progressInterval);
      setProgress(0);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isAnalyzing}
      className={`
        relative overflow-hidden
        mica rounded-xl px-4 py-3
        border border-surface-border
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isAnalyzing 
          ? 'cursor-wait' 
          : 'hover:bg-surface-hover hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 active:scale-95'
        }
        group
      `}
    >
      <div className="flex items-center gap-3">
        {/* Ícone de cérebro/chip com animação */}
        <div className={`
          relative w-6 h-6 flex items-center justify-center
          transition-transform duration-300
          ${isAnalyzing ? 'animate-spin' : 'group-hover:scale-110'}
        `}>
          {isAnalyzing ? (
            <Spinner small />
          ) : (
            <svg 
              className="w-6 h-6 text-accent-light" 
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
          
          {/* Efeito glow durante análise */}
          {isAnalyzing && (
            <div className="absolute inset-0 rounded-full bg-accent/30 animate-pulse blur-md" />
          )}
        </div>

        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-text-primary">
            {isAnalyzing ? 'Analisando...' : 'Análise Geral IA'}
          </span>
          {isAnalyzing && (
            <span className="text-xs text-text-secondary mt-0.5">
              Processando tarefas e testes...
            </span>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      {isAnalyzing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-hover">
          <div 
            className="h-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Efeito shimmer durante hover (não durante análise) */}
      {!isAnalyzing && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </button>
  );
};

