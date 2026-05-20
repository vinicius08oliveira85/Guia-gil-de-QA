import type { JiraTask, TaskIAAnalysis } from '../types';

export type TaskRiskLevel = TaskIAAnalysis['riskLevel'];

export interface TaskQaAlert {
  id: string;
  tooltip: string;
}

/** Borda lateral do card conforme risco (prioridade sobre tipo de issue). */
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

/** Badge compacto de risco para metadados do card. */
export function getTaskRiskBadgeClass(level: TaskRiskLevel): string {
  switch (level) {
    case 'Crítico':
      return 'rounded px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide bg-error/15 text-error ring-1 ring-error/30';
    case 'Alto':
      return 'rounded px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide bg-[color-mix(in_srgb,var(--brand-cta)_14%,transparent)] text-[var(--brand-cta)] ring-1 ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)]';
    case 'Médio':
      return 'rounded px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide bg-warning/15 text-warning ring-1 ring-warning/35';
    case 'Baixo':
    default:
      return 'rounded px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[color:var(--color-primary-deep)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]';
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
