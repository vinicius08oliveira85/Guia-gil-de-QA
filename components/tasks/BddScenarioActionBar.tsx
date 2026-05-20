import React from 'react';
import { Sparkles } from 'lucide-react';
import { PlusIcon } from '../common/Icons';
import { cn } from '../../utils/cn';
import { taskPanelBorderClass } from './taskActionLayout';

export type BddScenarioActionBarProps = {
  onGenerate: () => void;
  onAddManual: () => void;
  disabled?: boolean;
  /** Ex.: `mx-auto w-full max-w-2xl` (modal) ou `mx-auto w-fit` (card da tarefa). */
  className?: string;
};

/**
 * Barra única de ações BDD: gerar com IA + adicionar manualmente.
 * Visual alinhado ao tema (mica, tokens, touch ≥44px no mobile).
 */
export const BddScenarioActionBar: React.FC<BddScenarioActionBarProps> = ({
  onGenerate,
  onAddManual,
  disabled = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'mica flex flex-col gap-2 px-3 py-3 soft-shadow sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:px-4',
        taskPanelBorderClass,
        className
      )}
    >
      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled}
        className="app-btn-outline btn btn-sm min-h-[44px] w-full gap-2 disabled:cursor-not-allowed sm:min-h-0 sm:w-auto sm:max-w-xs sm:flex-1"
      >
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        Gerar Cenários com IA
      </button>
      <button
        type="button"
        onClick={onAddManual}
        disabled={disabled}
        className="app-btn-primary-inline btn btn-sm min-h-[44px] w-full gap-2 disabled:cursor-not-allowed sm:min-h-0 sm:w-auto sm:max-w-xs sm:flex-1"
      >
        <PlusIcon className="h-4 w-4 shrink-0" aria-hidden />
        Adicionar Cenário Manualmente
      </button>
    </div>
  );
};
