import React from 'react';
import { cn } from '../../utils/cn';
import {
  taskCardMetadataStripTypography,
  taskCardTitleClass,
  taskMetadataStripClass,
} from './taskActionLayout';

/** Faixa inset de metadados (ID, tipo, status) com scroll horizontal. */
export const TaskCardMetadataStrip: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(taskMetadataStripClass, taskCardMetadataStripTypography, className)}
    role="group"
    aria-label="Metadados da tarefa"
  >
    {children}
  </div>
);

export const TaskCardMetadataSeparator: React.FC = () => (
  <span className="shrink-0 opacity-60" aria-hidden>
    ·
  </span>
);

export interface TaskCardHeaderProps {
  /** Conteúdo da faixa superior (geralmente `TaskCardMetadataStrip`). */
  metadata: React.ReactNode;
  title: string;
  /** Checkbox, favorito, expandir subtarefas, etc. */
  controls?: React.ReactNode;
  /** Indicadores à direita do título (QA, freshness). */
  titleTrailing?: React.ReactNode;
  /** `span` na listagem Jira; `h3` no card legado. */
  titleAs?: 'span' | 'h3';
  titleClassName?: string;
  className?: string;
}

/**
 * Cabeçalho dos cards de tarefa.
 * Mobile: metadados no topo, controles e título empilhados.
 * Desktop (sm+): uma linha — controles · metadados · título · insights.
 */
export const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({
  metadata,
  title,
  controls,
  titleTrailing,
  titleAs = 'span',
  titleClassName,
  className,
}) => {
  const titleClasses = cn(
    titleAs === 'h3'
      ? 'text-base leading-tight sm:text-lg line-clamp-2 sm:line-clamp-1'
      : 'block min-w-0 w-full flex-1 break-words line-clamp-2 sm:line-clamp-1',
    taskCardTitleClass,
    titleClassName
  );

  const TitleTag = titleAs;

  return (
    <div
      className={cn(
        'flex min-w-0 w-full flex-1 overflow-hidden',
        'max-sm:flex-col max-sm:gap-tasks-panel-tight',
        'sm:flex-row sm:items-center sm:gap-2',
        className
      )}
    >
      {/* Mobile: metadados no topo; desktop: inline após controles */}
      <div className="min-w-0 max-sm:order-1 max-sm:w-full sm:order-2 sm:shrink-0">{metadata}</div>

      {controls ? (
        <div
          className={cn(
            'flex shrink-0 flex-nowrap items-center gap-tasks-panel-tight',
            'max-sm:order-2 max-sm:w-full',
            'sm:order-1'
          )}
        >
          {controls}
        </div>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-tasks-panel-tight overflow-hidden',
          'max-sm:order-3 max-sm:w-full',
          'sm:order-3 sm:flex-row sm:items-center sm:gap-2'
        )}
      >
        <TitleTag className={titleClasses} title={title}>
          {title}
        </TitleTag>
        {titleTrailing ? (
          <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-tasks-panel-tight sm:w-auto sm:flex-nowrap">
            {titleTrailing}
          </div>
        ) : null}
      </div>
    </div>
  );
};
