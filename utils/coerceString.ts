/**
 * Converte valores vindos de JSON/IndexedDB/Supabase para string segura.
 * Evita `TypeError: x.trim is not a function` quando o dado legado não é string.
 */
export function coerceOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === 'object') {
    const named = value as { name?: unknown };
    if (typeof named.name === 'string') {
      const trimmed = named.name.trim();
      return trimmed || undefined;
    }
  }

  const trimmed = String(value).trim();
  return trimmed || undefined;
}

/** String trimada; vazio vira `fallback`. */
export function coerceString(value: unknown, fallback = ''): string {
  return coerceOptionalString(value) ?? fallback;
}
