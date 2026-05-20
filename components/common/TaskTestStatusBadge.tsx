import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, MinusCircle, XCircle } from 'lucide-react';
import type { TaskTestStatus } from '../../types';
import { cn } from '../../utils/cn';

type TaskTestStatusBadgeValue = TaskTestStatus | 'sem_testes';

interface TaskTestStatusConfig {
  label: string;
  icon: React.ElementType;
  className: string;
  cardClassName: string;
  role: 'status' | 'alert' | 'none';
}

const TASK_TEST_STATUS_MAP: Record<TaskTestStatusBadgeValue, TaskTestStatusConfig> = {
  testar: {
    label: 'Testar',
    icon: Info,
    className:
      'border border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400',
    cardClassName:
      'border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[color:var(--color-primary-deep)] hover:bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]',
    role: 'status',
  },
  testando: {
    label: 'Testando',
    icon: AlertCircle,
    className:
      'border border-yellow-500/20 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400',
    cardClassName:
      'border-warning/35 bg-warning/10 text-warning hover:bg-warning/15',
    role: 'status',
  },
  pendente: {
    label: 'Pendente',
    icon: XCircle,
    className:
      'border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400',
    cardClassName: 'border-error/35 bg-error/10 text-error hover:bg-error/15',
    role: 'alert',
  },
  teste_concluido: {
    label: 'Teste Concluído',
    icon: CheckCircle,
    className:
      'border border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400',
    cardClassName:
      'border-success/35 bg-success/10 text-success hover:bg-success/15',
    role: 'status',
  },
  sem_testes: {
    label: 'Sem Testes',
    icon: MinusCircle,
    className:
      'border border-base-300 bg-base-200/70 text-base-content/70 hover:bg-base-200 dark:border-base-content/15',
    cardClassName:
      'border-base-300/70 bg-base-200/50 text-base-content/65 hover:bg-base-200/70',
    role: 'none',
  },
};

export interface TaskTestStatusBadgeProps {
  status: TaskTestStatusBadgeValue;
  /** Substitui o rótulo padrão (ex.: "Concluir" em Epic/História sem subtarefas). */
  labelOverride?: string;
  /** `card` = chip compacto alinhado aos metadados do JiraTaskItem. */
  variant?: 'default' | 'card';
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
    'inline-flex items-center gap-1 border font-medium transition-colors duration-200 whitespace-nowrap',
    isCard
      ? 'h-7 min-w-0 rounded-md px-2 text-[10px] font-semibold leading-tight shadow-sm'
      : 'h-5 cursor-default rounded-full px-2 py-0 text-xs',
    toneClass,
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
        {!hideIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
        <span className="truncate">{displayLabel}</span>
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
      {!hideIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};
