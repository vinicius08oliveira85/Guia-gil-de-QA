import React, { useMemo } from 'react';
import type { JiraProject, JiraQueue } from '../../services/jira/types';
import {
  formatJiraProjectLabel,
  formatJiraProjectSelectionSummary,
} from '../../utils/jiraProjectLabel';
import {
  getJiraQueueCategories,
  getJiraQueueStatusLabels,
} from '../../utils/jiraQueueTree';
import { JiraFilasCheckboxList } from './JiraFilasCheckboxList';
import { JiraFilasSearchableMultiSelect } from './JiraFilasSearchableMultiSelect';
import { jiraSolusFieldClass, jiraSolusFieldLabelClass, jiraSolusSelectClass } from './jiraSolusNeuUi';

export interface JiraFilasImportSelectorProps {
  projects: JiraProject[];
  queues: JiraQueue[];
  selectedProjectKeys: string[];
  onProjectKeysChange: (keys: string[]) => void;
  selectedQueueCategories: string[];
  onQueueCategoriesChange: (categories: string[]) => void;
  selectedQueueStatuses: string[];
  onQueueStatusesChange: (statuses: string[]) => void;
  isLoadingProjects?: boolean;
  isLoadingQueues?: boolean;
  disabled?: boolean;
}

/**
 * Assistente de importação em 3 etapas: Projeto → Fila → Status.
 */
export const JiraFilasImportSelector: React.FC<JiraFilasImportSelectorProps> = ({
  projects,
  queues,
  selectedProjectKeys,
  onProjectKeysChange,
  selectedQueueCategories,
  onQueueCategoriesChange,
  selectedQueueStatuses,
  onQueueStatusesChange,
  isLoadingProjects = false,
  isLoadingQueues = false,
  disabled = false,
}) => {
  const projectOptions = useMemo(
    () =>
      projects.map(project => ({
        value: project.key,
        label: formatJiraProjectLabel(project),
        searchText: `${project.key} ${project.name}`,
      })),
    [projects]
  );

  const projectSummary = useMemo(
    () => formatJiraProjectSelectionSummary(projects, selectedProjectKeys),
    [projects, selectedProjectKeys]
  );

  const queueCategoryOptions = useMemo(
    () => getJiraQueueCategories(queues).map(category => ({ value: category, label: category })),
    [queues]
  );

  const statusOptions = useMemo(
    () =>
      getJiraQueueStatusLabels(queues, selectedQueueCategories).map(status => ({
        value: status,
        label: status,
      })),
    [queues, selectedQueueCategories]
  );

  const hasProjects = selectedProjectKeys.length > 0;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className={jiraSolusFieldClass}>
        <span className={jiraSolusFieldLabelClass}>1. Projeto Jira</span>
        <JiraFilasSearchableMultiSelect
          options={projectOptions}
          selectedValues={selectedProjectKeys}
          onChange={onProjectKeysChange}
          disabled={disabled || isLoadingProjects}
          className={jiraSolusSelectClass}
          placeholder={isLoadingProjects ? 'Carregando…' : 'Selecione o(s) projeto(s)'}
          searchPlaceholder="Buscar projeto ou chave…"
          summaryLabel={projectSummary}
          aria-label="Selecionar projetos Jira"
        />
      </div>

      {hasProjects ? (
        <>
          <JiraFilasCheckboxList
            title="2. Fila"
            options={queueCategoryOptions}
            selectedValues={selectedQueueCategories}
            onChange={onQueueCategoriesChange}
            disabled={disabled}
            isLoading={isLoadingQueues}
            emptyMessage="Nenhuma fila categorizada neste projeto."
            aria-label="Selecionar filas de importação"
          />

          <JiraFilasCheckboxList
            title="3. Status"
            options={statusOptions}
            selectedValues={selectedQueueStatuses}
            onChange={onQueueStatusesChange}
            disabled={disabled || selectedQueueCategories.length === 0}
            isLoading={isLoadingQueues}
            emptyMessage={
              selectedQueueCategories.length === 0
                ? 'Selecione ao menos uma fila.'
                : 'Nenhum status disponível para as filas selecionadas.'
            }
            aria-label="Selecionar status de importação"
          />
        </>
      ) : (
        <p className="font-sans text-sm text-[var(--brand-text-muted)] lg:col-span-2">
          Selecione um ou mais projetos para escolher fila e status.
        </p>
      )}
    </div>
  );
};

JiraFilasImportSelector.displayName = 'JiraFilasImportSelector';
