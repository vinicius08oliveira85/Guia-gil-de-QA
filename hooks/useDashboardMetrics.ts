import { useMemo } from 'react';
import type { Project } from '../types';
import { computeProjectDashboardDeterministicMetrics } from '../utils/projectDashboardDeterministicMetrics';

/** Fatia para gráfico de pizza (Recharts). */
export interface DashboardPieSlice {
  name: string;
  value: number;
  fill: string;
}

/** Linha para gráfico de barras por membro (Recharts). */
export interface DashboardMemberBarRow {
  name: string;
  value: number;
  fill: string;
}

export interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  /** Percentual de tarefas concluídas (0–100). */
  efficiencyPercent: number;
  /** Status com contagem maior que zero, com cores do tema. */
  statusPieData: DashboardPieSlice[];
  /** Carga por responsável (top categorias + «Outros»). */
  workloadByMember: DashboardMemberBarRow[];
}

const MEMBER_BAR_FILLS = [
  'oklch(var(--p))',
  'oklch(var(--s))',
  'oklch(var(--a))',
  'oklch(var(--in))',
  'oklch(var(--su))',
  'oklch(var(--wa))',
  'oklch(var(--er))',
  'oklch(var(--bc) / 0.45)',
];

/**
 * Métricas determinísticas do dashboard (somente `reduce` / `filter` / agregações sobre `project.tasks`).
 * Não chama IA. Recalcula quando a referência de `project.tasks` muda.
 */
export function useDashboardMetrics(project: Project): DashboardMetrics {
  const tasks = project.tasks;

  return useMemo(() => {
    const m = computeProjectDashboardDeterministicMetrics(tasks);

    const statusPieData: DashboardPieSlice[] = m.statusDistribution
      .filter(s => s.value > 0)
      .map(s => ({
        name: s.name,
        value: s.value,
        fill: s.fill ?? 'oklch(var(--p))',
      }));

    const workloadByMember: DashboardMemberBarRow[] = m.assigneeDistribution.map((row, i) => ({
      name: row.name,
      value: row.value,
      fill:
        row.name === 'Outros'
          ? 'oklch(var(--bc) / 0.35)'
          : MEMBER_BAR_FILLS[i % MEMBER_BAR_FILLS.length],
    }));

    return {
      totalTasks: m.completion.total,
      completedTasks: m.completion.completed,
      overdueTasks: m.overdueCount,
      efficiencyPercent: m.completion.completionPercent,
      statusPieData,
      workloadByMember,
    };
  }, [tasks]);
}
