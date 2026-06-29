import type { JiraProject } from '../services/jira/types';

/**
 * Remove sufixo redundante de chave no nome vindo do Jira.
 * Ex.: "Sustentação (SUS)" → "Sustentação".
 */
export function cleanJiraProjectName(name: string, projectKey?: string): string {
  let cleaned = name.trim();
  if (!cleaned) return '';

  if (projectKey) {
    const key = projectKey.trim();
    if (key) {
      cleaned = cleaned
        .replace(new RegExp(`[,\\s]*\\(?${escapeRegExp(key)}\\)?\\s*$`, 'i'), '')
        .replace(/,\s*$/, '')
        .trim();
    }
  }

  return cleaned.replace(/\s+/g, ' ');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rótulo compacto em uma linha: "SUS — Sustentação".
 */
export function formatJiraProjectLabel(project: Pick<JiraProject, 'key' | 'name'>): string {
  const key = project.key.trim();
  const name = cleanJiraProjectName(project.name, key);
  return name ? `${key} — ${name}` : key;
}

/**
 * Texto resumido para múltiplos projetos selecionados.
 */
export function formatJiraProjectSelectionSummary(
  projects: Array<Pick<JiraProject, 'key' | 'name'>>,
  selectedKeys: string[]
): string {
  if (selectedKeys.length === 0) return 'Selecione o(s) projeto(s)';
  if (selectedKeys.length === 1) {
    const project = projects.find(p => p.key === selectedKeys[0]);
    return project ? formatJiraProjectLabel(project) : selectedKeys[0];
  }
  const first = projects.find(p => p.key === selectedKeys[0]);
  const firstLabel = first ? first.key : selectedKeys[0];
  return `${firstLabel} +${selectedKeys.length - 1}`;
}
