import React from 'react';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import type { ExecutionKindBadgeVariant } from '../../utils/testCaseMigration';
import { taskDetailsModalExecBadgeClass } from './taskDetailsNeuUi';

interface TestCaseExecutionKindBadgeButtonProps {
  label: string;
  variant: ExecutionKindBadgeVariant;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/** Badge clicável que alterna o tipo de execução do caso de teste. */
export const TestCaseExecutionKindBadgeButton: React.FC<
  TestCaseExecutionKindBadgeButtonProps
> = ({ label, variant, onClick, disabled = false, className }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'w-fit shrink-0 rounded-full transition-[transform,opacity,filter]',
      !disabled &&
        'cursor-pointer hover:brightness-105 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      disabled && 'cursor-not-allowed opacity-70',
      className
    )}
    title={
      disabled
        ? 'Edição do tipo de execução indisponível neste contexto'
        : 'Clique para alternar: Manual → Automatizado → Misto'
    }
    aria-label={`${label}. Clique para alternar o tipo de execução`}
  >
    <Badge
      variant="neu"
      size="sm"
      appearance="pill"
      className={cn(
        taskDetailsModalExecBadgeClass,
        variant === 'info' && 'border-primary/45',
        variant === 'warning' && 'border-amber-400/55'
      )}
    >
      <span className="normal-case tracking-normal">{label}</span>
    </Badge>
  </button>
);

TestCaseExecutionKindBadgeButton.displayName = 'TestCaseExecutionKindBadgeButton';
