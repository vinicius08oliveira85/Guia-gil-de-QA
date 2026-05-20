import type { JiraTask, TaskIAAnalysis } from '../types';

export type TaskRiskLevel = TaskIAAnalysis['riskLevel'];

export interface TaskQaAlert {
  id: string;
  tooltip: string;
}

/** Borda lateral do card conforme o tipo de issue (BUG / História / Tarefa / Epic). */
export function getTaskTypeLeftBorderClass(taskType: string | undefined): string {
  const norm = (taskType || '').trim().toLowerCase();
  if (norm === 'bug') {
    return 'border-l-4 border-l-error';
  }
  if (norm === 'história' || norm === 'historia' || norm === 'story') {
    return 'border-l-4 border-l-success';
  }
  if (norm === 'tarefa' || norm === 'task') {
    // Mesmo azul da badge TAREFA (pill info = bg-blue-600), não o token Daisy `info` do tema light.
    return 'border-l-4 border-l-blue-600';
  }
  if (norm === 'epic') {
    return 'border-l-4 border-l-[var(--jira-task-epic-accent)]';
  }
  return 'border-l-4 border-l-base-300/50';
}

/** Borda lateral do card conforme risco (uso legado; listagem usa tipo via `getTaskTypeLeftBorderClass`). */
export function getTaskRiskBorderClass(level: TaskRiskLevel): string {
  switch (level) {
    case 'Crítico':
      return 'border-l-4 border-l-error';
    case 'Alto':
      return 'border-l-4 border-l-[var(--brand-cta)]';
    case 'Médio':
      return 'border-l-4 border-l-warning';
    case 'Baixo':
    default:
      return 'border-l-4 border-l-[color:var(--color-primary)] opacity-90';
  }
}

const taskCardRiskBadgeLayout =
  'inline-flex h-4 max-h-4 min-h-4 shrink-0 items-center font-sans tracking-[var(--letter-spacing)] text-[9px] font-bold uppercase leading-none rounded-full px-1.5';

/** Badge compacto de risco para metadados do card. */
export function getTaskRiskBadgeClass(level: TaskRiskLevel): string {
  switch (level) {
    case 'Crítico':
      return `${taskCardRiskBadgeLayout} bg-error/15 text-error ring-1 ring-error/30`;
    case 'Alto':
      return `${taskCardRiskBadgeLayout} bg-[color-mix(in_srgb,var(--brand-cta)_14%,transparent)] text-[var(--brand-cta)] ring-1 ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)]`;
    case 'Médio':
      return `${taskCardRiskBadgeLayout} bg-warning/15 text-warning ring-1 ring-warning/35`;
    case 'Baixo':
    default:
      return `${taskCardRiskBadgeLayout} bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[color:var(--color-primary-deep)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]`;
  }
}

/** Alertas discretos de cobertura de QA (BDD / estratégia). */
export function getTaskQaCoverageAlerts(task: JiraTask, taskTypeNorm: string): TaskQaAlert[] {
  if (!['tarefa', 'bug', 'task'].includes(taskTypeNorm)) {
    return [];
  }

  const alerts: TaskQaAlert[] = [];

  if (!(task.bddScenarios?.length ?? 0)) {
    alerts.push({
      id: 'bdd',
      tooltip: 'Falta cenários BDD. Documente o fluxo principal em Gherkin.',
    });
  }

  if (!(task.testStrategy?.length ?? 0)) {
    alerts.push({
      id: 'strategy',
      tooltip: 'Falta estratégia de teste. Defina abordagem, escopo e ferramentas.',
    });
  }

  return alerts;
}
