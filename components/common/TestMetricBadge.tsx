import React from 'react';
import { cn } from '../../utils/cn';
import { taskNeuChipRaisedClass } from '../tasks/taskActionLayout';

type TestMetricTone = 'success' | 'error' | 'warning';
type TestMetricBadgeSize = 'sm' | 'md';

interface TestMetricBadgeProps {
  value: number;
  label: string;
  tone: TestMetricTone;
  size?: TestMetricBadgeSize;
  className?: string;
}

const TONE_CLASSES: Record<TestMetricTone, string> = {
  success: cn(taskNeuChipRaisedClass, 'text-success'),
  error: cn(taskNeuChipRaisedClass, 'text-error'),
  warning: cn(taskNeuChipRaisedClass, 'text-warning'),
};

const SIZE_CLASSES: Record<TestMetricBadgeSize, string> = {
  sm: 'h-5 min-w-5 px-1.5 text-[10px]',
  md: 'h-6 min-w-6 px-1.5 text-[11px]',
};

/**
 * Badge circular compacta para exibir contadores de métricas de teste.
 */
export const TestMetricBadge: React.FC<TestMetricBadgeProps> = ({
  value,
  label,
  tone,
  size = 'md',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold leading-none tabular-nums shrink-0',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className
      )}
      title={label}
      aria-label={`${value} ${label.toLowerCase()}`}
      role="status"
    >
      {value}
    </span>
  );
};
