import type { JiraFilasLocalFilters } from '../components/jiraSolus/JiraFilasFiltersModalContent';
import {
  EMPTY_JIRA_FILAS_FILTERS,
  SLA_FILTER_OPTIONS,
} from '../components/jiraSolus/JiraFilasFiltersModalContent';

export const JIRA_FILAS_LOCAL_FILTERS_KEY = 'jira-solus-filas-local-filters';

const ALLOWED_SLA_BUCKETS = new Set(SLA_FILTER_OPTIONS.map(o => o.value));

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/** Lê filtros locais persistidos da tela de Filas Jira. */
export function readJiraFilasLocalFilters(): JiraFilasLocalFilters {
  if (typeof window === 'undefined') return { ...EMPTY_JIRA_FILAS_FILTERS };
  try {
    const raw = localStorage.getItem(JIRA_FILAS_LOCAL_FILTERS_KEY);
    if (!raw) return { ...EMPTY_JIRA_FILAS_FILTERS };
    const parsed = JSON.parse(raw) as Partial<JiraFilasLocalFilters>;
    const slaBuckets = isStringArray(parsed.slaBuckets)
      ? parsed.slaBuckets.filter(
          (bucket): bucket is JiraFilasLocalFilters['slaBuckets'][number] =>
            ALLOWED_SLA_BUCKETS.has(bucket as JiraFilasLocalFilters['slaBuckets'][number])
        )
      : [];
    return {
      statuses: isStringArray(parsed.statuses) ? parsed.statuses : [],
      slaBuckets,
      types: isStringArray(parsed.types) ? parsed.types : [],
      assignees: isStringArray(parsed.assignees) ? parsed.assignees : [],
    };
  } catch {
    return { ...EMPTY_JIRA_FILAS_FILTERS };
  }
}

/** Persiste filtros locais da tela de Filas Jira. */
export function writeJiraFilasLocalFilters(filters: JiraFilasLocalFilters): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(JIRA_FILAS_LOCAL_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    /* quota ou modo privado */
  }
}
