import type { JiraTask, JiraTaskSla } from '../types';
import type { SlaBucket } from './jiraFilasMetrics';
import { DEFAULT_SLA_RISK_WINDOW_HOURS } from './jiraFilasMetrics';

export type JiraSlaDisplayStatus = 'met' | 'onTrack' | 'atRisk' | 'breached' | 'paused' | 'none';

const SLA_SHORT_NAMES: Record<string, string> = {
  'time to resolution': 'Resolução',
  'time to first response': '1ª resposta',
};

/**
 * Nome curto do SLA para exibição no card.
 */
export function getJiraSlaShortName(name: string): string {
  const normalized = name.trim().toLowerCase();
  return SLA_SHORT_NAMES[normalized] ?? name.trim();
}

/**
 * Formata data/hora do SLA no estilo compacto (ex.: "06 jul 14:03"), usado nos chips do card.
 */
export function formatJiraSlaDateTime(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const dayMonth = date
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .replace(/\./g, '')
    .replace(/ de /g, ' ');
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dayMonth} ${time}`;
}

/**
 * Formata data/hora do SLA no formato do Jira (ex.: "06 de jul. 14:03"), usado no resumo.
 */
export function formatJiraSlaDateTimeLong(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dayMonth} ${time}`;
}

/**
 * Classifica um SLA individual para cor/ícone no card.
 */
export function classifyJiraSlaDisplay(
  sla: JiraTaskSla,
  now: number = Date.now(),
  riskWindowHours: number = DEFAULT_SLA_RISK_WINDOW_HOURS
): JiraSlaDisplayStatus {
  if (sla.phase === 'completed') {
    return sla.breached ? 'breached' : 'met';
  }
  if (sla.phase === 'none') return 'none';
  if (sla.breached) return 'breached';

  const deadline = sla.deadlineAt ? new Date(sla.deadlineAt).getTime() : NaN;
  if (!Number.isNaN(deadline)) {
    if (deadline < now) return 'breached';
    if (deadline <= now + riskWindowHours * 60 * 60 * 1000) return 'atRisk';
  }

  return 'onTrack';
}

/**
 * Classe de cor do texto conforme status do SLA.
 */
export function getJiraSlaToneClass(status: JiraSlaDisplayStatus): string {
  switch (status) {
    case 'breached':
      return 'text-error';
    case 'atRisk':
      return 'text-warning';
    case 'met':
    case 'onTrack':
      return 'text-success';
    default:
      return 'text-[var(--leve-header-text-muted)]';
  }
}

/**
 * Rótulo compacto do SLA para o chip no card.
 */
export function formatJiraSlaChipLabel(sla: JiraTaskSla, status: JiraSlaDisplayStatus): string {
  const shortName = getJiraSlaShortName(sla.name);

  if (status === 'met') {
    const when = formatJiraSlaDateTime(sla.completedAt);
    return when ? `${shortName}: ${when}` : `${shortName}: atendido`;
  }

  if (status === 'breached' && sla.phase === 'completed') {
    return `${shortName}: estourado`;
  }

  if (status === 'breached') {
    const when = formatJiraSlaDateTime(sla.deadlineAt);
    return when ? `${shortName}: ${when}` : `${shortName}: estourado`;
  }

  const when = formatJiraSlaDateTime(sla.deadlineAt);
  if (when) return `${shortName}: ${when}`;

  if (sla.goalFriendly) return `${shortName} ${sla.goalFriendly}`;
  return shortName;
}

/**
 * Tooltip detalhado do SLA.
 */
export function formatJiraSlaTooltip(sla: JiraTaskSla, status: JiraSlaDisplayStatus): string {
  const statusLabels: Record<JiraSlaDisplayStatus, string> = {
    met: 'Atendido no prazo',
    onTrack: 'No prazo',
    atRisk: 'Em risco',
    breached: 'Estourado',
    paused: 'Pausado',
    none: 'Sem dados',
  };

  const parts = [`${sla.name}: ${statusLabels[status]}`];
  if (sla.goalFriendly) parts.push(sla.goalFriendly);
  if (sla.deadlineAt) {
    const deadline = formatJiraSlaDateTime(sla.deadlineAt);
    if (deadline) parts.push(`Prazo: ${deadline}`);
  }
  if (sla.completedAt) {
    const completed = formatJiraSlaDateTime(sla.completedAt);
    if (completed) parts.push(`Concluído: ${completed}`);
  }
  return parts.join(' · ');
}

/**
 * Classifica a tarefa com base nos SLAs do Jira (prioriza o pior status entre SLAs em andamento).
 */
export function classifyTaskSlaFromJiraSlas(
  slas: JiraTaskSla[],
  now: number = Date.now(),
  riskWindowHours: number = DEFAULT_SLA_RISK_WINDOW_HOURS
): SlaBucket | null {
  if (slas.length === 0) return null;

  const ongoing = slas.filter(s => s.phase === 'ongoing');
  const relevant = ongoing.length > 0 ? ongoing : slas;

  let worst: SlaBucket = 'onTrack';
  for (const sla of relevant) {
    const display = classifyJiraSlaDisplay(sla, now, riskWindowHours);
    if (display === 'breached') return 'overdue';
    if (display === 'atRisk') worst = 'atRisk';
    if (display === 'none' && worst === 'onTrack') worst = 'noDueDate';
  }

  if (ongoing.length === 0) {
    const allMet = slas.every(s => s.phase === 'completed' && !s.breached);
    if (allMet) return 'onTrack';
    if (slas.some(s => s.breached)) return 'overdue';
  }

  return worst;
}

/**
 * SLAs ordenados para exibição no card (em andamento primeiro, depois por criticidade).
 */
export function sortJiraSlasForDisplay(
  slas: JiraTaskSla[],
  now: number = Date.now(),
  riskWindowHours: number = DEFAULT_SLA_RISK_WINDOW_HOURS
): JiraTaskSla[] {
  const priority = (sla: JiraTaskSla) => {
    const status = classifyJiraSlaDisplay(sla, now, riskWindowHours);
    const phaseBoost = sla.phase === 'ongoing' ? 0 : 1;
    const statusRank: Record<JiraSlaDisplayStatus, number> = {
      breached: 0,
      atRisk: 1,
      onTrack: 2,
      paused: 3,
      met: 4,
      none: 5,
    };
    return phaseBoost * 10 + statusRank[status];
  };

  return [...slas].sort((a, b) => priority(a) - priority(b));
}

export function taskHasJiraSlas(task: JiraTask): boolean {
  return Array.isArray(task.jiraSlas) && task.jiraSlas.length > 0;
}
