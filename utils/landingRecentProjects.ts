import type { Project } from '../types';

/** Máximo de projetos recentes na home. */
export const LANDING_RECENT_PROJECTS_LIMIT = 3;

const LAST_OPENED_STORAGE_KEY = 'qa_landing_last_opened_project_ids';
const MAX_STORED_OPENED_IDS = 12;

function projectActivityTimestamp(project: Project): number {
  const iso = project.updatedAt || project.createdAt;
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

/** Lê IDs de projetos abertos recentemente (mais recente primeiro). */
export function getLastOpenedProjectIds(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LAST_OPENED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

/** Registra abertura de um projeto para o bloco Continuar da home. */
export function recordLastOpenedProject(projectId: string): void {
  if (typeof localStorage === 'undefined' || !projectId.trim()) return;
  try {
    const prev = getLastOpenedProjectIds().filter(id => id !== projectId);
    const next = [projectId, ...prev].slice(0, MAX_STORED_OPENED_IDS);
    localStorage.setItem(LAST_OPENED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Ordena projetos priorizando últimos abertos; preenche com updatedAt/createdAt.
 */
export function getRecentProjectsForLanding(
  projects: Project[],
  limit = LANDING_RECENT_PROJECTS_LIMIT,
  lastOpenedIds: string[] = getLastOpenedProjectIds()
): Project[] {
  if (projects.length === 0) return [];

  const byId = new Map(projects.map(p => [p.id, p]));
  const result: Project[] = [];
  const seen = new Set<string>();

  for (const id of lastOpenedIds) {
    const project = byId.get(id);
    if (!project || seen.has(id)) continue;
    result.push(project);
    seen.add(id);
    if (result.length >= limit) return result;
  }

  const rest = projects
    .filter(p => !seen.has(p.id))
    .sort((a, b) => projectActivityTimestamp(b) - projectActivityTimestamp(a));

  for (const project of rest) {
    result.push(project);
    if (result.length >= limit) break;
  }

  return result;
}

/** Rótulo curto da última atividade do projeto. */
export function formatProjectActivityLabel(
  project: Project,
  options?: { wasLastOpened?: boolean }
): string {
  if (options?.wasLastOpened) return 'Aberto recentemente';

  const iso = project.updatedAt || project.createdAt;
  if (!iso) return `${project.tasks?.length ?? 0} task(s)`;

  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return `${project.tasks?.length ?? 0} task(s)`;

  const days = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Atualizado hoje';
  if (days === 1) return 'Atualizado ontem';
  if (days < 7) return `Atualizado há ${days} dias`;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
}
