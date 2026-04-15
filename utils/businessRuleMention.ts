import type { BusinessRule } from '../types';

/**
 * Gera um identificador legível a partir do título (ex.: "login obrigatório" → "LoginObrigatorio").
 * Em caso de títulos que geram o mesmo slug no projeto, acrescenta sufixo do id para desambiguar.
 */
export function slugifyBusinessRuleTitleForMention(title: string): string {
  const parts = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return parts || 'Regra';
}

export function mentionTokenForRule(
  rule: Pick<BusinessRule, 'id' | 'title'>,
  allRules: Pick<BusinessRule, 'id' | 'title'>[]
): string {
  const base = slugifyBusinessRuleTitleForMention(rule.title);
  const dup = allRules.some(
    (r) => r.id !== rule.id && slugifyBusinessRuleTitleForMention(r.title) === base
  );
  const suffix = dup ? rule.id.replace(/-/g, '').slice(0, 8) : '';
  return `@${base}${suffix}`;
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Remove uma menção @… da descrição (espaços extras colapsados nas bordas). */
export function removeMentionFromDescription(description: string, mention: string): string {
  const esc = escapeRegExp(mention);
  let next = description.replace(new RegExp(`\\s*${esc}(?=\\s|$)`, 'g'), '');
  next = next.replace(/\s{2,}/g, ' ').trim();
  return next;
}

/** Acrescenta a menção na descrição se ainda não existir (match exato do token). */
export function appendMentionToDescription(description: string, mention: string): string {
  const esc = escapeRegExp(mention);
  if (new RegExp(`${esc}(?:\\s|$)`).test(description)) return description;
  const base = description.trimEnd();
  const sep = base.length > 0 && !base.endsWith('\n') ? ' ' : '';
  return `${base}${sep}${mention}`.trim();
}
