import type { DevStackConfig } from '../types';
import { normalizeDevStackConfig } from './devStackPresets';

function listOrDash(items: string[]): string {
  return items.length > 0 ? items.join(', ') : '(não informado)';
}

/** Formata a stack Dev para injeção em prompts de IA. */
export function formatDevStackForPrompt(stack: DevStackConfig | undefined | null): string {
  const s = normalizeDevStackConfig(stack);
  return [
    `Linguagens: ${listOrDash(s.languages)}`,
    `Frameworks: ${listOrDash(s.frameworks)}`,
    `Bancos de dados: ${listOrDash(s.databases)}`,
    `Ferramentas: ${listOrDash(s.tools)}`,
    `Estilo de arquitetura: ${s.architectureStyle || '(não informado)'}`,
    `Abordagem de testes: ${s.testingApproach || '(não informado)'}`,
    s.notes ? `Notas: ${s.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Resumo curto para cards e badges. */
export function formatDevStackSummary(stack: DevStackConfig | undefined | null): string {
  const s = normalizeDevStackConfig(stack);
  const parts = [...s.languages, ...s.frameworks].slice(0, 3);
  if (parts.length === 0) return 'Stack não configurada';
  return parts.join(' · ');
}
