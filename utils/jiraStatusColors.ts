const JIRA_COLOR_MAP: Record<string, string> = {
  'blue-gray': '#42526e',
  'medium-gray': '#6b778c',
  yellow: '#f5cd47',
  green: '#00875a',
  'green-light': '#4bce97',
  blue: '#0052cc',
  teal: '#00a3bf',
  purple: '#6554c0',
  red: '#ae2a19',
  brown: '#7f5f01',
  orange: '#c25100'
};

export interface JiraStatusCategoryInfo {
  key?: string;
  colorName?: string;
}

const FALLBACK_COLOR = '#42526e';

const normalizeHexColor = (color: string): string => {
  if (!color) return FALLBACK_COLOR;
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(trimmed)) {
    if (trimmed.length === 4) {
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return trimmed.toLowerCase();
  }
  if (/^([0-9a-fA-F]{6})$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  return FALLBACK_COLOR;
};

const normalizeString = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const keywordMatches = (value: string, keywords: string[]): boolean =>
  keywords.some(keyword => value.includes(keyword));

export const getJiraStatusColor = (
  statusName: string,
  statusCategory?: JiraStatusCategoryInfo
): string => {
  if (statusCategory) {
    if (statusCategory.colorName) {
      const mapped = JIRA_COLOR_MAP[statusCategory.colorName.toLowerCase()];
      if (mapped) {
        return mapped;
      }
    }
    if (statusCategory.key) {
      const keyColorMap: Record<string, string> = {
        done: '#00875a',
        'in-progress': '#0052cc',
        indeterminate: '#0052cc',
        'to-do': '#42526e',
        new: '#42526e'
      };
      const mapped = keyColorMap[statusCategory.key.toLowerCase()];
      if (mapped) {
        return mapped;
      }
    }
  }

  const normalized = normalizeString(statusName);

  if (
    keywordMatches(normalized, [
      'done',
      'concluido',
      'finalizado',
      'finalizada',
      'closed',
      'resolved',
      'confirmado',
      'confirmada',
      'aprovado',
      'aprovada',
      'homologado',
      'homologada',
      'ok',
      'complete'
    ])
  ) {
    return '#00875a';
  }

  if (
    keywordMatches(normalized, [
      'progress',
      'andamento',
      'desenvolvimento',
      'executando',
      'testing',
      'teste',
      'qa',
      'doing',
      'implementando',
      'em teste',
      'homologando'
    ])
  ) {
    return '#0052cc';
  }

  if (keywordMatches(normalized, ['review', 'validacao'])) {
    return '#6554c0';
  }

  if (
    keywordMatches(normalized, [
      'todo',
      'to do',
      'pendente',
      'aberto',
      'novo',
      'triagem',
      'triage',
      'backlog',
      'planejamento'
    ])
  ) {
    return '#42526e';
  }

  if (keywordMatches(normalized, ['bloqueado', 'blocked', 'impedido'])) {
    return '#c25100';
  }

  return FALLBACK_COLOR;
};

export const getJiraStatusTextColor = (backgroundColor: string): string => {
  const normalized = normalizeHexColor(backgroundColor);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#0f172a' : '#ffffff';
};

export const ensureJiraHexColor = (color: string | undefined, fallbackStatus?: string): string | undefined => {
  if (color) {
    return normalizeHexColor(color);
  }
  if (fallbackStatus) {
    return getJiraStatusColor(fallbackStatus);
  }
  return undefined;
};
