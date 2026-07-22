import { jiraSyncQueue } from '../services/jiraSyncQueue';

/**
 * Hook fino sobre a fila singleton de sync Jira.
 * Preferir `jiraSyncQueue` diretamente em serviços não-React.
 */
export function useJiraSyncQueue() {
  return jiraSyncQueue;
}
