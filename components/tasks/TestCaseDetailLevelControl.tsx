import React from 'react';
import type { TestCaseDetailLevel } from '../../types';
import { cn } from '../../utils/cn';

export type TestCaseDetailLevelControlProps = {
  /** Prefixo estável para ids acessíveis (ex.: id da tarefa). */
  idPrefix: string;
  value: TestCaseDetailLevel;
  onChange: (level: TestCaseDetailLevel) => void;
  disabled?: boolean;
  className?: string;
};

const RESUMIDO_TITLE =
  'Roteiro curto: poucos passos numerados, linguagem objetiva. Parâmetros e resultado esperado concisos.';
const ESTRUTURADO_TITLE =
  'Roteiro completo com verificações intermediárias, bullets • em parâmetros/resultado quando houver vários pontos, alinhado à formatação visual obrigatória do prompt.';

/**
 * Seleção do nível de detalhe da geração de casos de teste (IA): dois estados, touch-friendly.
 */
export const TestCaseDetailLevelControl: React.FC<TestCaseDetailLevelControlProps> = ({
  idPrefix,
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const groupId = `detail-level-${idPrefix}`;
  return (
    <fieldset
      className={cn('space-y-1.5', className)}
      disabled={disabled}
      aria-describedby={`${groupId}-hint`}
    >
      <legend
        id={`${groupId}-legend`}
        className="text-sm font-medium text-base-content/70 mb-1.5 block px-0.5"
      >
        Nível de detalhe
      </legend>
      <div
        className="flex w-full gap-1 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-base-200/40 p-1"
        role="radiogroup"
        aria-labelledby={`${groupId}-legend`}
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === 'Resumido'}
          id={`${groupId}-resumido`}
          title={RESUMIDO_TITLE}
          disabled={disabled}
          onClick={() => onChange('Resumido')}
          className={cn(
            'min-h-[44px] flex-1 rounded-[var(--radius)] px-2 py-2 text-center text-xs font-medium transition-colors sm:min-h-0 sm:px-3 sm:text-sm',
            value === 'Resumido'
              ? 'bg-primary text-primary-content soft-shadow'
              : 'text-base-content/75 hover:bg-base-300/50 hover:text-base-content'
          )}
        >
          Resumido
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === 'Estruturado'}
          id={`${groupId}-estruturado`}
          title={ESTRUTURADO_TITLE}
          disabled={disabled}
          onClick={() => onChange('Estruturado')}
          className={cn(
            'min-h-[44px] flex-1 rounded-[var(--radius)] px-2 py-2 text-center text-xs font-medium transition-colors sm:min-h-0 sm:px-3 sm:text-sm',
            value === 'Estruturado'
              ? 'bg-primary text-primary-content soft-shadow'
              : 'text-base-content/75 hover:bg-base-300/50 hover:text-base-content'
          )}
        >
          Estruturado
        </button>
      </div>
      <p id={`${groupId}-hint`} className="text-[11px] leading-snug text-base-content/55 px-0.5">
        Resumido: menos passos. Estruturado: roteiro completo e checagens intermediárias (passe o
        mouse nos botões para detalhes).
      </p>
    </fieldset>
  );
};
