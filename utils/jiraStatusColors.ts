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
  orange: '#c25100',
};

export interface JiraStatusCategoryInfo {
  key?: string;
  colorName?: string;
}

export type JiraStatusPaletteEntry = string | { name: string; color: string };

export const JIRA_STATUS_FALLBACK_COLOR = '#42526e';

const FALLBACK_COLOR = JIRA_STATUS_FALLBACK_COLOR;

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

/** Normaliza nome de status para comparação (sem acentos, minúsculas). */
export const normalizeJiraStatusName = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

interface JiraStatusNameColorResult {
  color: string;
  /** true quando alguma regra por palavra-chave no nome foi aplicada. */
  matchedByName: boolean;
}

const resolveJiraStatusColorByName = (statusName: string): JiraStatusNameColorResult => {
  const normalized = normalizeString(statusName);

  if (
    keywordMatches(normalized, [
      'done',
      'concluido',
      'concluida',
      'finalizado',
      'finalizada',
      'closed',
      'fechado',
      'fechada',
      'resolved',
      'resolvido',
      'resolvida',
      'confirmado',
      'confirmada',
      'aprovado',
      'aprovada',
      'homologado',
      'homologada',
      'ok',
      'complete',
      'atendido',
      'atendida',
      'entregue',
    ])
  ) {
    return { color: '#00875a', matchedByName: true };
  }

  if (
    keywordMatches(normalized, [
      'cancelado',
      'cancelada',
      'rejeitado',
      'rejeitada',
      'recusado',
      'recusada',
      'declined',
      'descartado',
      'descartada',
    ])
  ) {
    return { color: '#ae2a19', matchedByName: true };
  }

  if (
    keywordMatches(normalized, [
      'aguardando',
      'aguardo',
      'em espera',
      'espera',
      'waiting',
      'on hold',
      'em pausa',
      'pausado',
      'pausada',
      'suspenso',
      'suspensa',
    ])
  ) {
    return { color: '#f5cd47', matchedByName: true };
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
      'homologando',
      'escalated',
      'escalado',
      'escalada',
      'atendimento',
    ])
  ) {
    return { color: '#0052cc', matchedByName: true };
  }

  if (keywordMatches(normalized, ['review', 'validacao'])) {
    return { color: '#6554c0', matchedByName: true };
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
      'planejamento',
    ])
  ) {
    return { color: '#42526e', matchedByName: true };
  }

  if (keywordMatches(normalized, ['bloqueado', 'blocked', 'impedido'])) {
    return { color: '#c25100', matchedByName: true };
  }

  return { color: FALLBACK_COLOR, matchedByName: false };
};

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
        new: '#42526e',
      };
      const mapped = keyColorMap[statusCategory.key.toLowerCase()];
      if (mapped) {
        return mapped;
      }
    }
  }

  return resolveJiraStatusColorByName(statusName).color;
};

export const getJiraStatusTextColor = (backgroundColor: string): string => {
  const normalized = normalizeHexColor(backgroundColor);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#0f172a' : '#ffffff';
};

export const ensureJiraHexColor = (
  color: string | undefined,
  fallbackStatus?: string
): string | undefined => {
  if (color) {
    return normalizeHexColor(color);
  }
  if (fallbackStatus) {
    return getJiraStatusColor(fallbackStatus);
  }
  return undefined;
};

/**
 * Resolve a cor hex de um status usando a paleta da API Jira, com fallback heurístico.
 * Usado em Filas (Jira) e Acompanhamento de tarefas (Landing) para manter cores iguais.
 */
/**
 * Cor para persistir na paleta após buscar status na API Jira.
 * A API expõe sobretudo statusCategory (ex.: yellow para vários custom statuses);
 * a heurística por nome distingue AGUARDANDO, PENDENTE, ESCALATED, etc.
 */
export const resolveJiraStatusColorForStorage = (
  statusName: string,
  statusCategory?: JiraStatusCategoryInfo
): string => {
  const fromName = resolveJiraStatusColorByName(statusName);
  if (fromName.matchedByName) {
    return fromName.color;
  }
  return getJiraStatusColor(statusName, statusCategory);
};

export const resolveJiraStatusColorFromPalette = (
  statusName: string,
  palette?: JiraStatusPaletteEntry[] | null
): string => {
  const fromName = resolveJiraStatusColorByName(statusName);

  if (!statusName) {
    return fromName.color;
  }

  if (palette && palette.length > 0) {
    const normalizedTarget = normalizeJiraStatusName(statusName);
    const matched = palette.find(entry => {
      const entryName = typeof entry === 'string' ? entry : entry.name;
      return normalizeJiraStatusName(entryName) === normalizedTarget;
    });
    if (matched) {
      const paletteColor =
        typeof matched === 'string'
          ? ensureJiraHexColor(undefined, matched) ?? getJiraStatusColor(matched)
          : ensureJiraHexColor(matched.color, matched.name) ??
            getJiraStatusColor(matched.name);

      if (fromName.matchedByName) {
        return fromName.color;
      }
      return paletteColor;
    }
  }

  return fromName.color;
};

/** Estilo de lozenge Jira (fundo suave + indicador na cor do workflow). */
export interface JiraStatusLozengeStyles {
  backgroundColor: string;
  color: string;
  indicatorColor: string;
}

export const getJiraStatusLozengeStyles = (
  statusColor?: string
): JiraStatusLozengeStyles => {
  const indicator = statusColor ? normalizeHexColor(statusColor) : FALLBACK_COLOR;
  return {
    indicatorColor: indicator,
    // Fallback `98% 0 0` (base-200 claro) garante que, mesmo se `--b2` não existir
    // no escopo (ex.: dropdowns em portal para document.body), o `color-mix` continue
    // válido em produção — evita o badge perder a cor de fundo.
    backgroundColor: `color-mix(in srgb, ${indicator} 16%, oklch(var(--b2, 98% 0 0)))`,
    // Texto na cor da categoria do Jira (escurecida p/ contraste), em vez de um tom fixo.
    color: `color-mix(in srgb, ${indicator} 78%, #1c1c1c)`,
  };
};
