import React, { useMemo } from 'react';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';
import {
  hasJiraFilasSummaryFields,
  resolveJiraFilasSummaryFields,
} from '../../utils/jiraFilasSummaryFields';
import { CommentSection } from '../common/CommentSection';
import {
  leveTaskModalMutedClass,
} from '../common/projectCardUi';
import {
  taskDetailsModalSectionClass,
  taskDetailsOverviewLabelClass,
  taskDetailsOverviewSectionClass,
  taskDetailsOverviewSummaryCardClass,
  taskDetailsOverviewValueClass,
} from './taskDetailsNeuUi';

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
  cardClassName = taskDetailsOverviewSummaryCardClass,
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
        <div key={item.label} className={cardClassName}>
          <p className={cn(taskDetailsOverviewLabelClass, 'mb-1 block normal-case tracking-normal')}>
            {item.label}
          </p>
          <p className={taskDetailsOverviewValueClass}>{item.value}</p>
        </div>
      ))}
    </div>
  );
};

JiraFilasExtraFieldsGrid.displayName = 'JiraFilasExtraFieldsGrid';

export interface TaskSummaryCommentsSectionProps {
  task: JiraTask;
  className?: string;
  onAddComment?: (content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

/**
 * Comentários no resumo da tarefa (entre Descrição e Anexos do Jira).
 * Somente leitura nas Filas (Jira); editável no projeto quando callbacks são fornecidos.
 */
export const TaskSummaryCommentsSection: React.FC<TaskSummaryCommentsSectionProps> = ({
  task,
  className,
  onAddComment,
  onEditComment,
  onDeleteComment,
}) => {
  const comments = task.comments ?? [];
  const readOnly = !onAddComment;

  return (
    <section className={cn(taskDetailsOverviewSectionClass, className)}>
      <h3 className={taskDetailsOverviewLabelClass}>Comentários</h3>
      {comments.length === 0 && readOnly ? (
        <p className={cn(leveTaskModalMutedClass, 'italic text-sm')}>Sem comentários</p>
      ) : (
        <div className={cn(taskDetailsModalSectionClass, 'p-2.5')}>
          <CommentSection
            comments={comments}
            readOnly={readOnly}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
        </div>
      )}
    </section>
  );
};

TaskSummaryCommentsSection.displayName = 'TaskSummaryCommentsSection';

/** @deprecated Use {@link TaskSummaryCommentsSection}. */
export const JiraFilasCommentsSection = TaskSummaryCommentsSection;
