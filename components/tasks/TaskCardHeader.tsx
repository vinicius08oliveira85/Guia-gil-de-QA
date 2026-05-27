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
  /** Menu ⋮ etc. — só mobile (`md:hidden`), ao lado do título. */
  mobileTitleActions?: React.ReactNode;
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
  mobileTitleActions,
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
        'flex min-w-0 w-full flex-1 overflow-hidden max-md:overflow-visible',
        'max-md:flex-col max-md:gap-0.5',
        'md:flex-row md:items-center md:gap-2',
        className
      )}
    >
      {/* Mobile: metadados no topo; desktop: inline após controles */}
      <div className="min-w-0 max-md:order-1 max-md:w-full md:order-2 md:shrink-0">{metadata}</div>

      {controls ? (
        <div
          className={cn(
            'flex shrink-0 flex-nowrap items-center gap-tasks-panel-tight',
            'max-md:order-2 max-md:w-full max-md:gap-0.5',
            'md:order-1'
          )}
        >
          {controls}
        </div>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-tasks-panel-tight overflow-hidden max-md:overflow-visible',
          'max-md:order-3 max-md:w-full max-md:gap-0.5',
          'sm:order-3 sm:flex-row sm:items-center sm:gap-2'
        )}
      >
        <div className="flex min-w-0 max-md:w-full max-md:items-start max-md:gap-0.5 max-md:overflow-visible md:contents">
          <TitleTag className={cn(titleClasses, 'max-md:min-w-0 max-md:flex-1')} title={title}>
            {title}
          </TitleTag>
          {mobileTitleActions ? (
            <div className="task-card-mobile-title-actions relative z-[1] shrink-0 md:hidden">
              {mobileTitleActions}
            </div>
          ) : null}
        </div>
        {titleTrailing ? (
          <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-tasks-panel-tight max-md:gap-0.5 max-md:justify-start md:w-auto md:flex-nowrap">
            {titleTrailing}
          </div>
        ) : null}
      </div>
    </div>
  );
};
