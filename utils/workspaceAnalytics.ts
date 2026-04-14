import type { Project } from '../types';

/** Métricas agregadas de casos de teste em todos os projetos. */
export interface WorkspaceTestMetrics {
  totalTestCases: number;
  passedTestCases: number;
  /** Casos com status diferente de `Not Run`. */
  executedTestCases: number;
  /** (Passed / Total) * 100 — 0 se não houver casos. */
  testSuccessPercent: number;
  /** (Executados / Total) * 100 — 0 se não houver casos. */
  executionEfficiencyPercent: number;
}

/**
 * Agrega contagens de casos de teste com defensiva para `tasks` / `testCases` ausentes.
 */
export function computeWorkspaceTestMetrics(projects: Project[]): WorkspaceTestMetrics {
  let total = 0;
  let passed = 0;
  let executed = 0;

  for (const p of projects || []) {
    for (const t of p.tasks ?? []) {
      for (const tc of t.testCases ?? []) {
        total += 1;
        if (tc.status === 'Passed') passed += 1;
        if (tc.status !== 'Not Run') executed += 1;
      }
    }
  }

  const testSuccessPercent = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;
  const executionEfficiencyPercent = total > 0 ? Math.round((executed / total) * 1000) / 10 : 0;

  return {
    totalTestCases: total,
    passedTestCases: passed,
    executedTestCases: executed,
    testSuccessPercent,
    executionEfficiencyPercent,
  };
}

/** Distribuição de tarefas pelo campo `status` do app (To Do / In Progress / Done). */
export interface TaskWorkflowBuckets {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
}

export function computeTaskWorkflowBuckets(projects: Project[]): TaskWorkflowBuckets {
  let todo = 0;
  let inProgress = 0;
  let done = 0;

  for (const p of projects || []) {
    for (const t of p.tasks ?? []) {
      const s = t.status;
      if (s === 'Done') done += 1;
      else if (s === 'To Do') todo += 1;
      else inProgress += 1;
    }
  }

  return { todo, inProgress, done, total: todo + inProgress + done };
}

/** Percentual de tarefas concluídas (Done / total). */
export function computeTaskDonePercent(projects: Project[]): number {
  const b = computeTaskWorkflowBuckets(projects);
  return b.total > 0 ? Math.round((b.done / b.total) * 1000) / 10 : 0;
}

/** Projetos que possuem ao menos um caso Failed ou Blocked. */
export function computeProjectsWithTestExecutionAlerts(projects: Project[]): Project[] {
  return (projects || []).filter((p) => {
    for (const t of p.tasks ?? []) {
      for (const tc of t.testCases ?? []) {
        if (tc.status === 'Failed' || tc.status === 'Blocked') return true;
      }
    }
    return false;
  });
}

/** Fases concluídas / total de fases — 0 se não houver fases. */
export function computePhaseCompletionPercent(project: Project): number {
  const phases = project.phases ?? [];
  if (phases.length === 0) return 0;
  const completed = phases.filter((ph) => ph.status === 'Concluído').length;
  return Math.round((completed / phases.length) * 1000) / 10;
}
