import { JiraTask } from '../../types';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';

const STORY_POINTS_KEYS = ['Story Points', 'story points', 'Story points', 'customfield_10016'] as const;

/** Extrai pontos ou horas estimadas como unidade de carga (prioriza Story Points do Jira). */
export function parseStoryPointsFromCustomFields(task: JiraTask): number | null {
  const cf = task.jiraCustomFields;
  if (!cf || typeof cf !== 'object') return null;
  for (const k of STORY_POINTS_KEYS) {
    const v = (cf as Record<string, unknown>)[k];
    if (v == null) continue;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

export function getEffortUnits(task: JiraTask): number {
  const sp = parseStoryPointsFromCustomFields(task);
  if (sp != null && sp > 0) return sp;
  const h = task.estimatedHours;
  if (h != null && Number.isFinite(h) && h > 0) return h;
  return 0;
}

export function isDoneLikeCategory(task: JiraTask): boolean {
  const c = getTaskStatusCategory(task);
  return c === 'Concluído' || c === 'Validado';
}

export function computeStoryPointsLoad(tasks: JiraTask[]): {
  doneUnits: number;
  todoUnits: number;
  totalUnits: number;
  donePct: number;
} {
  let doneUnits = 0;
  let todoUnits = 0;
  for (const t of tasks) {
    const u = getEffortUnits(t);
    if (u <= 0) continue;
    if (isDoneLikeCategory(t)) doneUnits += u;
    else todoUnits += u;
  }
  const totalUnits = doneUnits + todoUnits;
  const donePct = totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;
  return { doneUnits, todoUnits, totalUnits, donePct };
}

const CEREMONY_RE =
  /revisão|revisao|review|daily|standup|dailys|cerimônia|cerimonia|planning|retro|refinamento|refinement/i;

export function isCeremonyOrReviewLikeTask(task: JiraTask): boolean {
  if (task.type === 'Bug') return false;
  const hay = `${task.title} ${(task.tags ?? []).join(' ')}`;
  return CEREMONY_RE.test(hay);
}

/** Data de referência: última tarefa não-bug marcada como cerimônia/revisão/daily. */
export function getCeremonyAnchorDate(tasks: JiraTask[]): Date | null {
  let max: number | null = null;
  for (const t of tasks) {
    if (!isCeremonyOrReviewLikeTask(t) || !t.createdAt) continue;
    const ts = new Date(t.createdAt).getTime();
    if (!Number.isFinite(ts)) continue;
    if (max == null || ts > max) max = ts;
  }
  return max != null ? new Date(max) : null;
}

export function computeRegressionDensity(tasks: JiraTask[]): {
  anchor: Date | null;
  regressionBugCount: number;
  storyCount: number;
  bugCount: number;
  ratioVsStories: number;
  alertHigh: boolean;
} {
  const bugs = tasks.filter((t) => t.type === 'Bug');
  const stories = tasks.filter((t) => t.type === 'História');
  const anchor = getCeremonyAnchorDate(tasks);
  let regressionBugCount = 0;
  if (anchor) {
    const anchorMs = anchor.getTime();
    for (const b of bugs) {
      if (!b.createdAt) continue;
      const ts = new Date(b.createdAt).getTime();
      if (Number.isFinite(ts) && ts > anchorMs) regressionBugCount++;
    }
  }
  const storyCount = stories.length;
  const bugCount = bugs.length;
  const ratioVsStories = storyCount > 0 ? regressionBugCount / storyCount : regressionBugCount > 0 ? 1 : 0;
  const alertHigh =
    (regressionBugCount >= 3 && ratioVsStories >= 0.2) ||
    (storyCount === 0 && regressionBugCount >= 2) ||
    (bugCount > 0 && storyCount > 0 && bugCount / storyCount >= 0.35);
  return { anchor, regressionBugCount, storyCount, bugCount, ratioVsStories, alertHigh };
}

const DEBT_TITLE_RE = /ajuste|sincronização|sincronizacao|correção|correcao/i;

export function isTechnicalDebtHeuristic(task: JiraTask): boolean {
  if (task.isTechnicalDebt) return true;
  const hay = `${task.title} ${(task.tags ?? []).join(' ')}`;
  return DEBT_TITLE_RE.test(hay);
}

export function countTechnicalDebtTasks(tasks: JiraTask[]): number {
  return tasks.filter(isTechnicalDebtHeuristic).length;
}

const CRITICAL_HAY_RE =
  /\b(logout|log\s*out|sair\s+da\s+conta)\b|lgpd|gdpr|segurança|security|autenticação|autenticacao|senha|password|csrf|xss|injeção|injecao|sql\s*inj|vulnerabil|criptografia|oauth|mfa|2fa/i;

export function isCriticalRiskTask(task: JiraTask): boolean {
  if (task.isCriticalPath) return true;
  const hay = `${task.title} ${(task.tags ?? []).join(' ')}`;
  return CRITICAL_HAY_RE.test(hay);
}

export function countOpenCriticalRiskTasks(tasks: JiraTask[]): number {
  return tasks.filter((t) => {
    if (!isCriticalRiskTask(t)) return false;
    return !isDoneLikeCategory(t);
  }).length;
}

/** Peso numérico para bugs (Story Points custom; senão severidade; senão prioridade). */
export function getBugWeight(task: JiraTask): number {
  const sp = parseStoryPointsFromCustomFields(task);
  if (sp != null && sp > 0) return Math.min(21, Math.round(sp));
  const sev = task.severity;
  if (sev === 'Crítico') return 7;
  if (sev === 'Alto') return 5;
  if (sev === 'Médio') return 3;
  if (sev === 'Baixo') return 1;
  const p = task.priority;
  if (p === 'Urgente') return 6;
  if (p === 'Alta') return 4;
  if (p === 'Média') return 3;
  if (p === 'Baixa') return 2;
  return 2;
}

/** Bugs não concluídos agrupados por peso (para barras horizontais). */
export function openBugsWeightDistribution(tasks: JiraTask[]): { weight: number; count: number }[] {
  const map = new Map<number, number>();
  for (const t of tasks) {
    if (t.type !== 'Bug') continue;
    if (isDoneLikeCategory(t)) continue;
    const w = getBugWeight(t);
    map.set(w, (map.get(w) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([weight, count]) => ({ weight, count }))
    .sort((a, b) => a.weight - b.weight);
}
