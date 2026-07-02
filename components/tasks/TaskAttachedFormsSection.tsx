import React from 'react';
import type { JiraTask } from '../../types';
import { Spinner } from '../common/Spinner';
import { cn } from '../../utils/cn';
import { leveTaskModalMutedClass } from '../common/projectCardUi';
import {
  taskDetailsModalDescriptionClass,
  taskDetailsOverviewLabelClass,
  taskDetailsOverviewSectionClass,
  taskDetailsOverviewSummaryCardClass,
  taskDetailsOverviewValueClass,
} from './taskDetailsNeuUi';
import {
  formatJiraFormAnswerValue,
  hasAttachedFormsContent,
} from '../../services/jira/attachedForms';
import { useJiraAttachedForms } from '../../hooks/useJiraAttachedForms';

export interface TaskAttachedFormsSectionProps {
  task: JiraTask;
  className?: string;
}

/**
 * Exibe "Formulários anexados" do Jira abaixo da descrição no resumo da tarefa.
 */
export const TaskAttachedFormsSection: React.FC<TaskAttachedFormsSectionProps> = ({
  task,
  className,
}) => {
  const { forms, loading, fetched, error, shouldShow } = useJiraAttachedForms(task);

  if (!shouldShow) return null;

  return (
    <section className={cn(taskDetailsOverviewSectionClass, className)}>
      <h3 className={taskDetailsOverviewLabelClass}>Formulários anexados</h3>

      {loading ? (
        <div className={cn(taskDetailsModalDescriptionClass, 'flex items-center gap-2')}>
          <Spinner size="sm" />
          <span className={cn(leveTaskModalMutedClass, 'text-sm')}>
            Carregando formulários do Jira…
          </span>
        </div>
      ) : error ? (
        <p className={cn(leveTaskModalMutedClass, 'italic text-sm')}>
          Não foi possível carregar os formulários anexados.
        </p>
      ) : fetched && !hasAttachedFormsContent(forms) ? (
        <p className={cn(leveTaskModalMutedClass, 'italic')}>Sem formulários anexados</p>
      ) : (
        <div className={cn(taskDetailsModalDescriptionClass, 'space-y-3')}>
          {forms.map(form => (
            <div key={form.id} className={taskDetailsOverviewSummaryCardClass}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className={cn(taskDetailsOverviewValueClass, 'font-semibold')}>{form.name}</p>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    form.submitted
                      ? 'bg-success/15 text-success'
                      : 'bg-warning/15 text-warning'
                  )}
                >
                  {form.submitted ? 'Submetido' : 'Rascunho'}
                </span>
                {form.updated ? (
                  <span className={cn(leveTaskModalMutedClass, 'text-xs')}>
                    Atualizado em {new Date(form.updated).toLocaleString('pt-BR')}
                  </span>
                ) : null}
              </div>

              {form.answers.length > 0 ? (
                <dl className="space-y-2">
                  {form.answers.map((answer, index) => {
                    const label = answer.label?.trim() || `Campo ${index + 1}`;
                    const value = formatJiraFormAnswerValue(answer);
                    return (
                      <div key={`${form.id}-${label}-${index}`}>
                        <dt className={cn(taskDetailsOverviewLabelClass, 'mb-0.5 block normal-case tracking-normal')}>
                          {label}
                        </dt>
                        <dd className={cn(taskDetailsOverviewValueClass, 'whitespace-pre-wrap')}>
                          {value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p className={cn(leveTaskModalMutedClass, 'text-sm italic')}>
                  Formulário sem respostas visíveis.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

TaskAttachedFormsSection.displayName = 'TaskAttachedFormsSection';
