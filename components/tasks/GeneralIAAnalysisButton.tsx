import React from 'react';
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
}) => {
  const handleClick = async () => {
    if (isAnalyzing) return;
    try {
      await onAnalyze();
    } catch {
      // Caller handles error
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isAnalyzing}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-300 flex items-center gap-1.5',
        'text-base-content/70 hover:bg-base-200 hover:text-base-content',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
      aria-label={isAnalyzing ? 'Analisando' : 'Análise IA'}
    >
      {isAnalyzing ? (
        <Spinner small />
      ) : (
        <svg
          className="w-3.5 h-3.5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      )}
      <span>{isAnalyzing ? 'Analisando…' : 'Análise IA'}</span>
    </button>
  );
};
