import React from 'react';
import { cn } from '../../utils/cn';

export type StatusVariant = 'connected' | 'disconnected' | 'configured' | 'warning';

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  connected: 'border-success/35 bg-success/10 text-success',
  disconnected: 'border-base-300 bg-base-200 text-base-content/72',
  configured: 'border-primary/35 bg-primary/10 text-primary',
  warning: 'border-primary/30 bg-primary/8 text-primary',
};

const dotStyles: Record<StatusVariant, string> = {
  connected: 'bg-success',
  disconnected: 'bg-base-content/72',
  configured: 'bg-primary',
  warning: 'bg-primary',
};

const ariaLabels: Record<StatusVariant, string> = {
  connected: 'Conectado',
  disconnected: 'Desconectado',
  configured: 'Configurado',
  warning: 'Aviso',
};

export const StatusBadge = React.memo<StatusBadgeProps>(({ variant, children, className }) => {
  const label = typeof children === 'string' ? children : ariaLabels[variant];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-xs font-semibold',
        variantStyles[variant],
        className
      )}
      aria-label={`Status: ${label}`}
      role="status"
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} aria-hidden />
      {children}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
