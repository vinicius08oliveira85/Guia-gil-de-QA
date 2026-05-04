import { JiraTask } from '../../types';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';

const MS_DAY = 86400000;

/** Agrupa bugs abertos por primeira tag ou componente (volumetria por área). */
export function computeOpenBugsByModule(tasks: JiraTask[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const t of tasks) {
    if (t.type !== 'Bug') continue;
    if (getTaskStatusCategory(t) === 'Concluído') continue;
    const label =
      (t.tags && t.tags[0]?.trim()) ||
      (t.components && t.components[0]?.name?.trim()) ||
      'Sem módulo';
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/** Conta bugs com vínculo Jira sugerindo reabertura (sem alterar modelo de dados). */
export function countBugsWithReopenLinks(tasks: JiraTask[]): number {
  const reopenRe = /reopen|reopened|reabert|reaberto|re-open/i;
  return tasks.filter(
    t => t.type === 'Bug' && (t.issueLinks?.some(l => reopenRe.test(l.type)) ?? false)
  ).length;
}

/** Lead time médio (dias) entre criação e conclusão para bugs fechados. */
export function averageBugLeadTimeDays(tasks: JiraTask[]): number | null {
  const closed = tasks.filter(t => t.type === 'Bug' && t.completedAt && t.createdAt);
  if (closed.length === 0) return null;
  let sum = 0;
  for (const b of closed) {
    const end = new Date(b.completedAt!).getTime();
    const start = new Date(b.createdAt!).getTime();
    if (Number.isFinite(end) && Number.isFinite(start) && end >= start) {
      sum += (end - start) / MS_DAY;
    }
  }
  return sum > 0 ? sum / closed.length : null;
}

/** Histórias: agrupamento estilo Jira (To Do / In Progress / Done). */
export function computeStoryWorkflow(tasks: JiraTask[]): {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
} {
  const stories = tasks.filter(t => t.type === 'História');
  let todo = 0;
  let inProgress = 0;
  let done = 0;
  for (const s of stories) {
    const c = getTaskStatusCategory(s);
    if (c === 'Concluído' || c === 'Validado') done++;
    else if (c === 'Em Andamento' || c === 'Bloqueado') inProgress++;
    else todo++;
  }
  return { todo, inProgress, done, total: stories.length };
}

/** Uma série por semana (índice 0 = mais antigo, último = semana mais recente): bugs criados. */
export function defectCreatedPerWeekSeries(tasks: JiraTask[], weekCount = 10): number[] {
  const bugs = tasks.filter(t => t.type === 'Bug' && t.createdAt);
  const series: number[] = [];
  const now = Date.now();
  for (let i = weekCount - 1; i >= 0; i--) {
    const weekEnd = new Date(now - i * 7 * MS_DAY);
    const weekStart = new Date(weekEnd.getTime() - 7 * MS_DAY);
    let c = 0;
    for (const b of bugs) {
      const d = new Date(b.createdAt!);
      if (!Number.isFinite(d.getTime())) continue;
      if (d >= weekStart && d < weekEnd) c++;
    }
    series.push(c);
  }
  return series;
}
