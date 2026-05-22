import React from 'react';
import { cn } from '../../utils/cn';

export type StatusVariant = 'connected' | 'disconnected' | 'configured' | 'warning';

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  connected:
    'border-[color-mix(in_srgb,#10b981_35%,transparent)] bg-[color-mix(in_srgb,#10b981_10%,var(--leve-header-cream))] text-[#0d7a4f]',
  disconnected:
    'border-[var(--leve-header-border)] bg-[var(--leve-header-cream)] text-[var(--leve-header-text-muted)]',
  configured:
    'border-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-accent)_10%,var(--leve-header-cream))] text-[var(--leve-header-accent)]',
  warning:
    'border-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-header-cream))] text-[var(--leve-header-accent)]',
};

const dotStyles: Record<StatusVariant, string> = {
  connected: 'bg-[#10b981]',
  disconnected: 'bg-[var(--leve-header-text-muted)]',
  configured: 'bg-[var(--leve-header-accent)]',
  warning: 'bg-[var(--leve-header-accent)]',
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
