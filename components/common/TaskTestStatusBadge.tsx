import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, MinusCircle, XCircle } from 'lucide-react';
import type { TaskTestStatus } from '../../types';
import { cn } from '../../utils/cn';

type TaskTestStatusBadgeValue = TaskTestStatus | 'sem_testes';

interface TaskTestStatusConfig {
  label: string;
  icon: React.ElementType;
  className: string;
  role: 'status' | 'alert' | 'none';
}

const TASK_TEST_STATUS_MAP: Record<TaskTestStatusBadgeValue, TaskTestStatusConfig> = {
  testar: {
    label: 'Testar',
    icon: Info,
    className:
      'border border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400',
    role: 'status',
  },
  testando: {
    label: 'Testando',
    icon: AlertCircle,
    className:
      'border border-yellow-500/20 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400',
    role: 'status',
  },
  pendente: {
    label: 'Pendente',
    icon: XCircle,
    className:
      'border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400',
    role: 'alert',
  },
  teste_concluido: {
    label: 'Teste Concluído',
    icon: CheckCircle,
    className:
      'border border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400',
    role: 'status',
  },
  sem_testes: {
    label: 'Sem Testes',
    icon: MinusCircle,
    className:
      'border border-base-300 bg-base-200/70 text-base-content/70 hover:bg-base-200 dark:border-base-content/15',
    role: 'none',
  },
};

export interface TaskTestStatusBadgeProps {
  status: TaskTestStatusBadgeValue;
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
  className,
  hideIcon = false,
  onClick,
  disabled = false,
}) => {
  const config = useMemo(() => TASK_TEST_STATUS_MAP[status], [status]);
  const Icon = config.icon;
  const sharedClassName = cn(
    'inline-flex items-center gap-1 rounded-full border px-2 py-0 text-xs font-medium transition-all duration-200',
    'h-5 cursor-default whitespace-nowrap',
    config.className,
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
          'min-h-[44px] px-3 py-2 sm:min-h-0 sm:h-7 sm:px-3.5 sm:py-1.5',
          'justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20'
        )}
        role={config.role}
        aria-live={config.role === 'alert' ? 'assertive' : 'polite'}
        aria-label={config.label}
      >
        {!hideIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
        <span className="truncate">{config.label}</span>
      </button>
    );
  }

  return (
    <span
      className={sharedClassName}
      role={config.role}
      aria-live={config.role === 'alert' ? 'assertive' : 'polite'}
      aria-label={config.label}
    >
      {!hideIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span className="truncate">{config.label}</span>
    </span>
  );
};
