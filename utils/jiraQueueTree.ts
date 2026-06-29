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

/** Dimensões extraídas do nome da fila JSM para o assistente de importação. */
export interface JiraQueueDimensions {
  category: string;
  statusLabel: string;
}

/**
 * Lista categorias de fila (ex.: Solus, Tasy) presentes nas filas categorizadas.
 */
export function getJiraQueueCategories(queues: JiraQueue[]): string[] {
  const categories = new Set<string>();
  for (const queue of queues) {
    const { category } = parseJiraQueueName(queue.name);
    if (category) categories.add(category);
  }
  return Array.from(categories).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Lista rótulos de status de fila (ex.: Abertos, Concluídos).
 * Quando `categories` é informado, restringe aos status disponíveis nessas filas.
 */
export function getJiraQueueStatusLabels(queues: JiraQueue[], categories?: string[]): string[] {
  const categoryFilter = categories?.length ? new Set(categories) : null;
  const labels = new Set<string>();

  for (const queue of queues) {
    const { category, label } = parseJiraQueueName(queue.name);
    if (!category) continue;
    if (categoryFilter && !categoryFilter.has(category)) continue;
    labels.add(label);
  }

  return Array.from(labels).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Resolve IDs de fila a partir da seleção de categoria (fila) + status.
 */
export function resolveQueueIdsFromFilasSelection(
  queues: JiraQueue[],
  selectedCategories: string[],
  selectedStatuses: string[]
): string[] {
  if (selectedCategories.length === 0 || selectedStatuses.length === 0) return [];

  const categorySet = new Set(selectedCategories);
  const statusSet = new Set(selectedStatuses);

  return queues
    .filter(queue => {
      const { category, label } = parseJiraQueueName(queue.name);
      return !!category && categorySet.has(category) && statusSet.has(label);
    })
    .map(queue => queue.id);
}
