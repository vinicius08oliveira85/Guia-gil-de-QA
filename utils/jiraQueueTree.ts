import type { JiraQueue } from '../services/jira/types';

export interface JiraQueueTreeItem {
  queue: JiraQueue;
  /** Rótulo exibido sem o sufixo de categoria. */
  label: string;
}

export interface JiraQueueTreeGroup {
  id: string;
  label: string;
  items: JiraQueueTreeItem[];
}

const OTHER_GROUP_ID = 'outras';
const OTHER_GROUP_LABEL = 'Outras';

const CATEGORY_SUFFIX_RE = /\s*[[(]([^[\]()]+)[\])]\s*$/;

/**
 * Extrai categoria e rótulo curto a partir do nome da fila JSM.
 * Ex.: "Abertos [Governança]" → { category: "Governança", label: "Abertos" }.
 * Filas sem sufixo (ex.: "Todas abertas", "Minhas") retornam category null e são omitidas.
 */
export function parseJiraQueueName(name: string): { category: string | null; label: string } {
  const trimmed = name.trim();
  const match = trimmed.match(CATEGORY_SUFFIX_RE);
  if (!match) {
    return { category: null, label: trimmed };
  }
  return {
    category: match[1].trim(),
    label: trimmed.slice(0, match.index).trim() || trimmed,
  };
}

/**
 * Agrupa filas do JSM em categorias expansíveis (modelo sidebar do Jira).
 * Filas globais sem categoria (Favoritos no JSM) são ignoradas.
 */
export function buildJiraQueueTree(queues: JiraQueue[]): JiraQueueTreeGroup[] {
  const groups = new Map<string, JiraQueueTreeItem[]>();

  for (const queue of queues) {
    const { category, label } = parseJiraQueueName(queue.name);
    if (!category) continue;

    const groupId = category.toLowerCase().replace(/\s+/g, '-');

    if (!groups.has(groupId)) {
      groups.set(groupId, []);
    }
    groups.get(groupId)!.push({ queue, label });
  }

  const sortedGroupIds = Array.from(groups.keys()).sort((a, b) => {
    const labelA = groups.get(a)?.[0] ? parseJiraQueueName(groups.get(a)![0].queue.name).category : a;
    const labelB = groups.get(b)?.[0] ? parseJiraQueueName(groups.get(b)![0].queue.name).category : b;
    return (labelA ?? '').localeCompare(labelB ?? '', 'pt-BR');
  });

  const result: JiraQueueTreeGroup[] = [];

  for (const groupId of sortedGroupIds) {
    const items = groups.get(groupId);
    if (!items?.length) continue;
    const categoryLabel = parseJiraQueueName(items[0].queue.name).category;
    result.push({
      id: groupId,
      label: categoryLabel || OTHER_GROUP_LABEL,
      items: sortQueueItems(items),
    });
  }

  return result;
}

function sortQueueItems(items: JiraQueueTreeItem[]): JiraQueueTreeItem[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export function getSelectableQueueIds(queues: JiraQueue[]): Set<string> {
  return new Set(
    buildJiraQueueTree(queues).flatMap(group => group.items.map(item => item.queue.id))
  );
}

export function getQueueIdsFromSelection(
  selectedQueueIds: Iterable<string>,
  queues: JiraQueue[]
): string[] {
  const available = getSelectableQueueIds(queues);
  return Array.from(selectedQueueIds).filter(id => available.has(id));
}
