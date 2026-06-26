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

const FAVORITES_GROUP_ID = 'favoritos';
const FAVORITES_GROUP_LABEL = 'Favoritos';
const OTHER_GROUP_ID = 'outras';
const OTHER_GROUP_LABEL = 'Outras';

const CATEGORY_SUFFIX_RE = /\s*[[(]([^[\]()]+)[\])]\s*$/;

/**
 * Extrai categoria e rótulo curto a partir do nome da fila JSM.
 * Ex.: "Abertos [Governança]" → { category: "Governança", label: "Abertos" }.
 */
export function parseJiraQueueName(name: string): { category: string; label: string } {
  const trimmed = name.trim();
  const match = trimmed.match(CATEGORY_SUFFIX_RE);
  if (!match) {
    return { category: FAVORITES_GROUP_LABEL, label: trimmed };
  }
  return {
    category: match[1].trim(),
    label: trimmed.slice(0, match.index).trim() || trimmed,
  };
}

/**
 * Agrupa filas do JSM em categorias expansíveis (modelo sidebar do Jira).
 */
export function buildJiraQueueTree(queues: JiraQueue[]): JiraQueueTreeGroup[] {
  const groups = new Map<string, JiraQueueTreeItem[]>();

  for (const queue of queues) {
    const { category, label } = parseJiraQueueName(queue.name);
    const groupId =
      category === FAVORITES_GROUP_LABEL
        ? FAVORITES_GROUP_ID
        : category.toLowerCase().replace(/\s+/g, '-');
    const groupLabel = category === FAVORITES_GROUP_LABEL ? FAVORITES_GROUP_LABEL : category;

    if (!groups.has(groupId)) {
      groups.set(groupId, []);
    }
    groups.get(groupId)!.push({ queue, label });
  }

  const result: JiraQueueTreeGroup[] = [];

  if (groups.has(FAVORITES_GROUP_ID)) {
    result.push({
      id: FAVORITES_GROUP_ID,
      label: FAVORITES_GROUP_LABEL,
      items: sortQueueItems(groups.get(FAVORITES_GROUP_ID)!),
    });
    groups.delete(FAVORITES_GROUP_ID);
  }

  const sortedGroupIds = Array.from(groups.keys()).sort((a, b) => {
    const labelA = groups.get(a)?.[0] ? parseJiraQueueName(groups.get(a)![0].queue.name).category : a;
    const labelB = groups.get(b)?.[0] ? parseJiraQueueName(groups.get(b)![0].queue.name).category : b;
    return labelA.localeCompare(labelB, 'pt-BR');
  });

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

  if (result.length === 0 && queues.length > 0) {
    return [
      {
        id: OTHER_GROUP_ID,
        label: OTHER_GROUP_LABEL,
        items: sortQueueItems(queues.map(queue => ({ queue, label: queue.name }))),
      },
    ];
  }

  return result;
}

function sortQueueItems(items: JiraQueueTreeItem[]): JiraQueueTreeItem[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export function getQueueIdsFromSelection(
  selectedQueueIds: Iterable<string>,
  queues: JiraQueue[]
): string[] {
  const available = new Set(queues.map(queue => queue.id));
  return Array.from(selectedQueueIds).filter(id => available.has(id));
}
