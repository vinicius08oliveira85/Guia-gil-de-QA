import React from 'react';
import { cn } from '../../utils/cn';
import {
  backlogListSurfaceClass,
  backlogListSurfaceHeaderClass,
} from './backlogToolbarLayout';

export interface BacklogListSurfaceProps {
  enabled?: boolean;
  itemCount: number;
  scopeLabel: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Envelope visual da lista do backlog (faixa de cabeçalho + corpo).
 * Com `enabled={false}`, renderiza só os filhos (modo Todas as tarefas).
 */
export const BacklogListSurface: React.FC<BacklogListSurfaceProps> = ({
  enabled = true,
  itemCount,
  scopeLabel,
  children,
  className,
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <section className={cn(backlogListSurfaceClass, className)} aria-label="Lista do backlog">
      <header className={backlogListSurfaceHeaderClass}>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-text-muted)]">
          Lista do backlog
        </span>
        <span className="text-xs font-medium text-[var(--brand-text-strong)]">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          <span className="text-[var(--brand-text-muted)]"> · {scopeLabel}</span>
        </span>
      </header>
      <div className="min-w-0 p-3 sm:p-4">{children}</div>
    </section>
  );
};
