import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, MinusCircle, XCircle } from 'lucide-react';
import type { TaskTestStatus } from '../../types';
import { cn } from '../../utils/cn';
import {
  taskCardBadgePillShape,
  taskCardBadgePillTypography,
  taskCardTestStatusChipLayout,
  taskCardTypography,
  taskNeuChipRaisedClass,
  taskNeuStatusToneClass,
} from '../tasks/taskActionLayout';

type TaskTestStatusBadgeValue = TaskTestStatus | 'sem_testes';

interface TaskTestStatusConfig {
  label: string;
  icon: React.ElementType;
  className: string;
  cardClassName: string;
  role: 'status' | 'alert' | 'none';
}

const neuStatusTone = (status: TaskTestStatusBadgeValue) => taskNeuStatusToneClass[status];

const TASK_TEST_STATUS_MAP: Record<TaskTestStatusBadgeValue, TaskTestStatusConfig> = {
  testar: {
    label: 'Testar',
    icon: Info,
    className: cn(taskNeuChipRaisedClass, neuStatusTone('testar')),
    cardClassName: neuStatusTone('testar'),
    role: 'status',
  },
  testando: {
    label: 'Testando',
    icon: AlertCircle,
    className: cn(taskNeuChipRaisedClass, neuStatusTone('testando')),
    cardClassName: neuStatusTone('testando'),
    role: 'status',
  },
  pendente: {
    label: 'Pendente',
    icon: XCircle,
    className: cn(taskNeuChipRaisedClass, neuStatusTone('pendente')),
    cardClassName: neuStatusTone('pendente'),
    role: 'alert',
  },
  teste_concluido: {
    label: 'Teste Concluído',
    icon: CheckCircle,
    className: cn(taskNeuChipRaisedClass, neuStatusTone('teste_concluido')),
    cardClassName: neuStatusTone('teste_concluido'),
    role: 'status',
  },
  sem_testes: {
    label: 'Sem Testes',
    icon: MinusCircle,
    className: cn(taskNeuChipRaisedClass, neuStatusTone('sem_testes')),
    cardClassName: neuStatusTone('sem_testes'),
    role: 'none',
  },
};

export interface TaskTestStatusBadgeProps {
  status: TaskTestStatusBadgeValue;
  /** Substitui o rótulo padrão (ex.: "Concluir" em Epic/História sem subtarefas). */
  labelOverride?: string;
  /** `card` = chip compacto alinhado aos metadados do JiraTaskItem. */
  variant?: 'default' | 'card';
  /** Substitui `taskCardTestStatusChipLayout` quando `variant="card"`. */
  chipLayoutClassName?: string;
  className?: string;
  hideIcon?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

/**
 * Badge semântica para estados de teste, reutilizada em cards e listas.
 */
export const TaskTestStatusBadge: React.FC<TaskTestStatusBadgeProps> = ({
  status,
  labelOverride,
  variant = 'default',
  chipLayoutClassName,
  className,
  hideIcon = false,
  onClick,
  disabled = false,
}) => {
  const config = useMemo(() => TASK_TEST_STATUS_MAP[status], [status]);
  const displayLabel = labelOverride ?? config.label;
  const Icon = config.icon;
  const isCard = variant === 'card';
  const toneClass = isCard ? config.cardClassName : config.className;
  const sharedClassName = cn(
    'inline-flex items-center gap-1 whitespace-nowrap',
    isCard
      ? cn(chipLayoutClassName ?? taskCardTestStatusChipLayout, toneClass)
      : cn(
          'badge-task-format h-5 cursor-default px-2.5 text-xs normal-case',
          taskCardBadgePillShape,
          taskCardBadgePillTypography,
          toneClass
        ),
    disabled && 'pointer-events-none opacity-50',
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          sharedClassName,
          isCard
            ? 'w-full justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 max-md:min-h-[44px]'
            : 'min-h-[44px] justify-center px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20 sm:min-h-0 sm:h-7 sm:px-3.5 sm:py-1.5'
        )}
        role={config.role}
        aria-live={config.role === 'alert' ? 'assertive' : 'polite'}
        aria-label={displayLabel}
      >
        {!hideIcon && <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />}
        <span className="truncate leading-none">{displayLabel}</span>
      </button>
    );
  }

  return (
    <span
      className={sharedClassName}
      role={config.role}
      aria-live={config.role === 'alert' ? 'assertive' : 'polite'}
      aria-label={displayLabel}
    >
      {!hideIcon && <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />}
      <span className="truncate leading-none">{displayLabel}</span>
    </span>
  );
};
