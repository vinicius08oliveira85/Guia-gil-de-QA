import React from 'react';
import type { TestCaseDetailLevel } from '../../types';
import { cn } from '../../utils/cn';
import { leveTaskModalFieldLabelClass, leveTaskModalMutedXsClass } from '../common/projectCardUi';
import {
  taskSegmentedControlClass,
  taskSegmentedOptionActiveClass,
  taskSegmentedOptionIdleClass,
} from './taskActionLayout';

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
        className={cn(leveTaskModalFieldLabelClass, 'mb-1.5 block px-0.5 normal-case')}
      >
        Nível de detalhe
      </legend>
      <div className={taskSegmentedControlClass} role="radiogroup"
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
            'min-h-[44px] sm:min-h-0',
            value === 'Resumido' ? taskSegmentedOptionActiveClass : taskSegmentedOptionIdleClass
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
            'min-h-[44px] sm:min-h-0',
            value === 'Estruturado' ? taskSegmentedOptionActiveClass : taskSegmentedOptionIdleClass
          )}
        >
          Estruturado
        </button>
      </div>
      <p id={`${groupId}-hint`} className={cn(leveTaskModalMutedXsClass, 'px-0.5')}>
        Resumido: menos passos. Estruturado: roteiro completo e checagens intermediárias (passe o
        mouse nos botões para detalhes).
      </p>
    </fieldset>
  );
};
