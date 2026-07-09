import type { CursorAgentAction } from '../types';

export const CURSOR_IMPLEMENTATION_TOOL_LABEL = 'Cursor AI (Agente)';

export const CURSOR_AGENT_ACTION_LABELS: Record<CursorAgentAction, string> = {
  create: 'Criar',
  modify: 'Modificar',
  delete: 'Excluir',
};

export const CURSOR_AGENT_ACTION_BADGE_CLASS: Record<CursorAgentAction, string> = {
  create: 'badge-success',
  modify: 'badge-info',
  delete: 'badge-error',
};

export function normalizeCursorAgentAction(value: unknown): CursorAgentAction {
  if (value === 'create' || value === 'modify' || value === 'delete') return value;
  return 'create';
}
