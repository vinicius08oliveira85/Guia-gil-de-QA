import type { BddScenario, BusinessRule, JiraTask, Project, TestStrategy } from '../../types';
import { getBusinessRulePromptText } from '../../utils/businessRulePromptText';

/** Limite do bloco de regras de negócio no prompt (projetos com muitas regras). */
export const BUSINESS_RULES_PROMPT_MAX_CHARS = 4000;

/**
 * Monta o bloco de regras para o prompt a partir de `task.linkedBusinessRuleIds`
 * e regras que listam a task em `linkedTaskIds`.
 */
export function formatBusinessRulesForPrompt(
  project: Project | null | undefined,
  task?: JiraTask | null
): string {
  if (!task) return '';
  const all = project?.businessRules ?? [];
  if (all.length === 0) return '';

  const byId = new Map(all.map(r => [r.id, r]));
  const selectedIds = new Set<string>();

  for (const id of task.linkedBusinessRuleIds ?? []) {
    if (id) selectedIds.add(id);
  }

  for (const rule of all) {
    if ((rule.linkedTaskIds ?? []).includes(task.id)) {
      selectedIds.add(rule.id);
    }
  }

  const categoryKeys = new Set(
    (task.linkedBusinessRuleCategories ?? []).map(c => String(c).trim()).filter(Boolean)
  );
  for (const rule of all) {
    const cat = (rule.category ?? '').trim();
    if (categoryKeys.has(cat)) {
      selectedIds.add(rule.id);
    }
  }

  if (selectedIds.size === 0) return '';

  const items = Array.from(selectedIds)
    .map(id => byId.get(id))
    .filter((r): r is BusinessRule => !!r);
  if (items.length === 0) return '';

  items.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

  const header =
    '### REGRAS DE NEGÓCIO APLICÁVEIS ###\n' +
    'Valide o escopo apenas com estas regras. Não invente comportamentos.\n';

  const lines: string[] = [];
  let used = header.length;
  for (let i = 0; i < items.length; i++) {
    const r = items[i];
    const body = getBusinessRulePromptText(r);
    const block =
      `[Regra ${i + 1}: ${r.title}]\n` +
      `id: ${r.id}\n` +
      `Conteúdo: ${body || '(sem conteúdo)'}`;

    const nextLen = block.length + (lines.length ? 2 : 0);
    if (used + nextLen > BUSINESS_RULES_PROMPT_MAX_CHARS) {
      lines.push('[... demais regras omitidas por limite de tamanho ...]');
      break;
    }
    lines.push(block);
    used += nextLen;
  }

  const body = lines.join('\n\n');
  return `${header}\n${body}`.trim();
}

export function summarizeStrategiesForPrompt(strategies: TestStrategy[], maxChars = 2800): string {
  if (!strategies.length) return '(nenhuma estratégia)';
  const lines = strategies.map(
    s =>
      `- **${s.testType}**: ${s.description.slice(0, 400)}${s.description.length > 400 ? '…' : ''}`
  );
  return lines.join('\n').slice(0, maxChars);
}

export function summarizeBddForPrompt(scenarios: BddScenario[], maxChars = 4500): string {
  if (!scenarios.length) return '(nenhum cenário BDD)';
  const parts = scenarios.map(
    b =>
      `#### ${b.title}\n${(b.gherkin || '').slice(0, 1200)}${(b.gherkin || '').length > 1200 ? '\n…' : ''}`
  );
  return parts.join('\n\n').slice(0, maxChars);
}
