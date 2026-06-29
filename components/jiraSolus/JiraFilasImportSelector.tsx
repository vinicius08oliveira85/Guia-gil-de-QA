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
import { JiraFilasSearchableMultiSelect } from './JiraFilasSearchableMultiSelect';
import { jiraSolusFieldClass, jiraSolusFieldLabelClass, jiraSolusSelectClass } from './jiraSolusNeuUi';

const formatSelectionSummary = (
  options: { value: string; label: string }[],
  selectedValues: string[],
  emptyLabel: string
): string => {
  if (selectedValues.length === 0) return emptyLabel;
  if (selectedValues.length === 1) {
    const selectedOption = options.find(option => option.value === selectedValues[0]);
    return selectedOption?.label ?? selectedValues[0];
  }
  return `${selectedValues.length} selecionados`;
};

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
  const hasQueueCategories = selectedQueueCategories.length > 0;

  const queueSummary = useMemo(
    () => formatSelectionSummary(queueCategoryOptions, selectedQueueCategories, 'Selecione a(s) fila(s)'),
    [queueCategoryOptions, selectedQueueCategories]
  );

  const statusSummary = useMemo(
    () =>
      formatSelectionSummary(
        statusOptions,
        selectedQueueStatuses,
        hasQueueCategories ? 'Selecione o(s) status' : 'Selecione fila(s) primeiro'
      ),
    [hasQueueCategories, selectedQueueStatuses, statusOptions]
  );

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

      <div className={jiraSolusFieldClass}>
        <span className={jiraSolusFieldLabelClass}>2. Fila</span>
        <JiraFilasSearchableMultiSelect
          options={queueCategoryOptions}
          selectedValues={selectedQueueCategories}
          onChange={onQueueCategoriesChange}
          disabled={disabled || !hasProjects || isLoadingQueues}
          className={jiraSolusSelectClass}
          placeholder={isLoadingQueues ? 'Carregando…' : 'Selecione a(s) fila(s)'}
          searchPlaceholder="Buscar fila…"
          summaryLabel={isLoadingQueues ? 'Carregando…' : queueSummary}
          aria-label="Selecionar filas de importação"
        />
      </div>

      <div className={jiraSolusFieldClass}>
        <span className={jiraSolusFieldLabelClass}>3. Status</span>
        <JiraFilasSearchableMultiSelect
          options={statusOptions}
          selectedValues={selectedQueueStatuses}
          onChange={onQueueStatusesChange}
          disabled={disabled || !hasProjects || !hasQueueCategories || isLoadingQueues}
          className={jiraSolusSelectClass}
          placeholder={isLoadingQueues ? 'Carregando…' : 'Selecione o(s) status'}
          searchPlaceholder="Buscar status…"
          summaryLabel={isLoadingQueues ? 'Carregando…' : statusSummary}
          aria-label="Selecionar status de importação"
        />
      </div>
    </div>
  );
};

JiraFilasImportSelector.displayName = 'JiraFilasImportSelector';
