export const LANDING_TASK_FOLLOW_UP_ASSIGNEES_KEY = 'qa_landing_task_follow_up_assignees';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/** Lê responsáveis selecionados no filtro da home (vazio = todos). */
export function readLandingTaskFollowUpAssignees(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LANDING_TASK_FOLLOW_UP_ASSIGNEES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persiste responsáveis selecionados no filtro da home. */
export function writeLandingTaskFollowUpAssignees(assignees: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANDING_TASK_FOLLOW_UP_ASSIGNEES_KEY, JSON.stringify(assignees));
  } catch {
    /* quota ou modo privado */
  }
}
