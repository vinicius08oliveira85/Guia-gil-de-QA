/**
 * Extrai texto legível de valores de custom fields do Jira.
 */
export function formatJiraCustomFieldValue(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map(item => formatJiraCustomFieldValue(item))
      .filter((part): part is string => !!part);
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.value === 'string' && record.value.trim()) return record.value.trim();
    if (typeof record.name === 'string' && record.name.trim()) return record.name.trim();
    if (typeof record.displayName === 'string' && record.displayName.trim()) {
      return record.displayName.trim();
    }
    if (typeof record.label === 'string' && record.label.trim()) return record.label.trim();
  }

  return undefined;
}
