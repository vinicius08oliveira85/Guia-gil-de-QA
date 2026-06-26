import React, { useMemo } from 'react';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';
import {
  hasJiraFilasSummaryFields,
  resolveJiraFilasSummaryFields,
} from '../../utils/jiraFilasSummaryFields';
import { CommentSection } from '../common/CommentSection';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalMutedClass,
  leveTaskModalStrongClass,
} from '../common/projectCardUi';
import { taskDetailsModalSectionClass } from './taskDetailsNeuUi';

export interface JiraFilasExtraFieldsGridProps {
  task: JiraTask;
  className?: string;
  /** Classes do card interno (modal vs lista inline). */
  cardClassName?: string;
}

/**
 * Grid de campos extras do resumo das Filas (Jira): Serviço, Setor/Diretoria e Tipo de solicitação.
 */
export const JiraFilasExtraFieldsGrid: React.FC<JiraFilasExtraFieldsGridProps> = ({
  task,
  className,
  cardClassName = taskDetailsModalSectionClass,
}) => {
  const fields = useMemo(() => resolveJiraFilasSummaryFields(task), [task]);
  if (!hasJiraFilasSummaryFields(fields)) return null;

  const items = [
    { label: 'Serviço', value: fields.service },
    { label: 'Setor/Diretoria', value: fields.sector },
    { label: 'Tipo de solicitação', value: fields.requestType },
  ].filter(item => item.value);

  if (items.length === 0) return null;

  return (
    <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map(item => (
        <div key={item.label} className={cn(cardClassName, 'p-2.5')}>
          <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block normal-case tracking-normal')}>
            {item.label}
          </p>
          <p className={cn('text-sm font-semibold', leveTaskModalStrongClass)}>{item.value}</p>
        </div>
      ))}
    </div>
  );
};

JiraFilasExtraFieldsGrid.displayName = 'JiraFilasExtraFieldsGrid';

export interface JiraFilasCommentsSectionProps {
  task: JiraTask;
  className?: string;
}

/**
 * Comentários do Jira no resumo das Filas — somente leitura (como Colaboração no projeto).
 */
export const JiraFilasCommentsSection: React.FC<JiraFilasCommentsSectionProps> = ({
  task,
  className,
}) => {
  const comments = task.comments ?? [];
  if (comments.length === 0) {
    return (
      <section className={cn('space-y-2', className)}>
        <h3 className={leveTaskModalFieldLabelClass}>Comentários</h3>
        <p className={cn(leveTaskModalMutedClass, 'italic')}>Sem comentários</p>
      </section>
    );
  }

  return (
    <section className={className}>
      <CommentSection comments={comments} readOnly />
    </section>
  );
};

JiraFilasCommentsSection.displayName = 'JiraFilasCommentsSection';
