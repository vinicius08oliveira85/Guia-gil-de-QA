import type { Project } from '../types';

/** Aplica ordem manual (ex.: após arrastar card no dashboard). Projetos sem id na lista vão ao final. */
export function applyManualProjectOrder(projects: Project[], orderIds: string[]): Project[] {
  if (!orderIds.length) return projects;

  const rank = new Map(orderIds.map((id, index) => [id, index]));

  return [...projects].sort((a, b) => {
    const aRank = rank.get(a.id);
    const bRank = rank.get(b.id);
    if (aRank === undefined && bRank === undefined) return 0;
    if (aRank === undefined) return 1;
    if (bRank === undefined) return -1;
    return aRank - bRank;
  });
}

export function buildProjectOrderIds(projects: Project[]): string[] {
  return projects.map(p => p.id);
}

/** Move um projeto para `targetIndex` na lista de ids (0 = primeiro card). */
export function moveProjectIdInOrder(
  orderIds: string[],
  projectId: string,
  targetIndex: number
): string[] {
  const next = orderIds.filter(id => id !== projectId);
  const clamped = Math.max(0, Math.min(targetIndex, next.length));
  next.splice(clamped, 0, projectId);
  return next;
}
