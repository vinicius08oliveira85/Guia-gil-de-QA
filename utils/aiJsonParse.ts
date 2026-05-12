/**
 * Normaliza texto de modelo antes de `JSON.parse`: remove cercas Markdown
 * (` ```json ` … ` ``` `) e texto explicativo comum antes do primeiro `{` ou `[`.
 */
export function stripAiMarkdownJsonFence(raw: string): string {
  let t = raw.trim();
  if (!t) return t;

  t = t.replace(/^\uFEFF/, '');
  t = t.replace(/^```(?:json|JSON)?\s*\r?\n?/m, '');
  t = t.replace(/\r?\n?```\s*$/m, '');
  t = t.trim();

  if (t.startsWith('{') || t.startsWith('[')) {
    return t;
  }

  const brace = t.indexOf('{');
  const bracket = t.indexOf('[');
  const candidates = [brace, bracket].filter(i => i >= 0);
  if (candidates.length === 0) {
    return t;
  }
  const start = Math.min(...candidates);
  return t.slice(start).trim();
}

export function parseAiJsonText<T = Record<string, unknown>>(raw: string): T {
  const cleaned = stripAiMarkdownJsonFence(raw);
  return JSON.parse(cleaned) as T;
}
