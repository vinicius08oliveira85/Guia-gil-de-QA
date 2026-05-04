import { JiraTask } from '../types';

/**
 * Formata uma data ISO para o formato esperado pelo Jira (YYYY-MM-DD)
 */
export function formatDateForJira(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Formata uma data do Jira para ISO string
 */
export function parseJiraDate(jiraDate: string): string {
  if (!jiraDate) return '';
  // Jira retorna datas no formato ISO, então podemos retornar diretamente
  return jiraDate;
}

/**
 * Valida se uma chave de issue do Jira é válida (formato PROJ-123)
 */
export function isValidJiraKey(key: string): boolean {
  return /^[A-Z]+-\d+$/.test(key);
}

/**
 * Extrai o projeto da chave do Jira (ex: "PROJ-123" -> "PROJ")
 */
export function extractProjectKeyFromIssueKey(issueKey: string): string | null {
  const match = issueKey.match(/^([A-Z]+)-\d+$/);
  return match ? match[1] : null;
}

/**
 * Valida campos do Jira antes de sincronizar
 */
export function validateJiraFields(task: JiraTask): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar chave do Jira
  if (!isValidJiraKey(task.id)) {
    errors.push(`ID da tarefa "${task.id}" não é uma chave válida do Jira`);
  }

  // Validar dueDate se existir
  if (task.dueDate) {
    const date = new Date(task.dueDate);
    if (isNaN(date.getTime())) {
      errors.push('Data de vencimento inválida');
    }
  }

  // Validar time tracking se existir
  if (task.timeTracking) {
    // Validar formato de tempo (ex: "2h 30m", "1d 2h", etc.)
    const timePattern = /^(\d+[dwmyh]?\s*)+$/i;
    if (
      task.timeTracking.originalEstimate &&
      !timePattern.test(task.timeTracking.originalEstimate)
    ) {
      errors.push('Formato de tempo estimado inválido (use formato como "2h 30m")');
    }
    if (
      task.timeTracking.remainingEstimate &&
      !timePattern.test(task.timeTracking.remainingEstimate)
    ) {
      errors.push('Formato de tempo restante inválido (use formato como "2h 30m")');
    }
    if (task.timeTracking.timeSpent && !timePattern.test(task.timeTracking.timeSpent)) {
      errors.push('Formato de tempo gasto inválido (use formato como "2h 30m")');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Mapeia campos do JiraTask para o formato esperado pela API do Jira
 */
export function mapTaskToJiraFields(task: JiraTask): { [key: string]: any } {
  const fields: { [key: string]: any } = {};

  if (task.dueDate) {
    fields.duedate = formatDateForJira(task.dueDate);
  }

  if (task.timeTracking) {
    fields.timetracking = {};
    if (task.timeTracking.originalEstimate) {
      fields.timetracking.originalEstimate = task.timeTracking.originalEstimate;
    }
    if (task.timeTracking.remainingEstimate) {
      fields.timetracking.remainingEstimate = task.timeTracking.remainingEstimate;
    }
    if (task.timeTracking.timeSpent) {
      fields.timetracking.timeSpent = task.timeTracking.timeSpent;
    }
  }

  if (task.environment !== undefined) {
    fields.environment = task.environment;
  }

  if (task.components && task.components.length > 0) {
    fields.components = task.components.map(comp => ({ id: comp.id }));
  }

  if (task.fixVersions && task.fixVersions.length > 0) {
    fields.fixVersions = task.fixVersions.map(version => ({ id: version.id }));
  }

  // Campos customizados
  if (task.jiraCustomFields) {
    Object.keys(task.jiraCustomFields).forEach(key => {
      fields[key] = task.jiraCustomFields![key];
    });
  }

  return fields;
}
