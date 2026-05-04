import type {
  BddScenario,
  BusinessRule,
  JiraTask,
  JiraTaskType,
  Project,
  TestCaseDetailLevel,
  TestStrategy,
} from '../../types';
import { getDocumentContext } from './documentContextService';

/** Tamanho máximo do trecho de especificação injetado após o bloco da tarefa (evita documento “engolir” a tarefa). */
export const TASK_GEN_MAX_DOC_CHARS = 3200;

/** Limite do bloco de regras de negócio no prompt (projetos com muitas regras). */
export const BUSINESS_RULES_PROMPT_MAX_CHARS = 4000;

/**
 * Monta o bloco de regras para o prompt a partir de:
 * - `task.linkedBusinessRuleIds` (regras individuais), e
 * - `task.linkedBusinessRuleCategories` (todas as regras do projeto nessas categorias),
 * unindo por `id` sem duplicar e respeitando {@link BUSINESS_RULES_PROMPT_MAX_CHARS}.
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

  // Coleta regras por categorias vinculadas
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

  items.sort(
    (a, b) =>
      a.category.localeCompare(b.category, 'pt-BR') || a.title.localeCompare(b.title, 'pt-BR')
  );

  const header =
    '### REGRAS DE NEGÓCIO APLICÁVEIS ###\n' +
    'Valide o escopo apenas com estas regras. Não invente comportamentos.\n';

  const lines: string[] = [];
  let used = header.length;
  for (let i = 0; i < items.length; i++) {
    const r = items[i];
    const refs = (r.linkedBusinessRuleIds ?? [])
      .map(id => byId.get(id))
      .filter((x): x is BusinessRule => !!x);
    const refLine =
      refs.length > 0
        ? `\nReferências (regras vinculadas nesta regra): ${refs.map(x => `${x.title} [${x.category}] [id: ${x.id}]`).join('; ')}`
        : '';
    const block =
      `[Regra ${i + 1}: ${r.title} — ${r.category}]\n` +
      `id: ${r.id}\n` +
      `Descrição: ${r.description}${refLine}`;

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

/**
 * Instrução unificada de análise (título, descrição, regras vinculadas) para as fases de geração por tarefa.
 */
export function buildTestGenerationRolePreamble(
  _taskTitle: string,
  _taskDescription: string,
  rulesBlock: string
): string {
  const rb = rulesBlock.trim();
  const emptyRulesMsg =
    '\n\n### REGRAS DE NEGÓCIO APLICÁVEIS ###\n' +
    '(nenhuma regra vinculada; use titulo, descricao e anexos.)\n';
  const rulesPart = rb ? `\n\n${rb}\n` : emptyRulesMsg;
  return (
    `Analise o bloco TAREFA abaixo (título, descrição, comentários, imagens e anexos quando constarem). ` +
    `Use as REGRAS DE NEGÓCIO vinculadas somente quando a seção delimitada estiver preenchida; não invente regras fora do escopo da tarefa.${rulesPart}\n` +
    `Com base nisso, gere Cenários BDD, Estratégias e Casos de Teste altamente assertivos.`
  ).trim();
}

export function shouldGenerateTestCasesAndBdd(taskType?: JiraTaskType): boolean {
  return taskType === 'Tarefa' || taskType === 'Bug' || taskType === undefined;
}

export async function buildComplementaryDocumentSection(
  project: Project | null | undefined
): Promise<string> {
  if (!project) return '';
  const raw = await getDocumentContext(project);
  if (!raw?.trim()) return '';
  const t = raw.trim();
  const excerpt =
    t.length <= TASK_GEN_MAX_DOC_CHARS
      ? t
      : `${t.slice(0, TASK_GEN_MAX_DOC_CHARS)}\n[... truncado ...]`;
  return `
═══════════════════════════════════════════════════════════════
CONTEXTO COMPLEMENTAR (especificação do projeto)
Use apenas se for diretamente relevante. Não invente escopo, telas ou integrações que não apareçam no título/descrição da tarefa.
═══════════════════════════════════════════════════════════════
${excerpt}
`;
}

function taskHeaderBlock(
  title: string,
  description: string,
  taskType?: JiraTaskType,
  attachmentsContext?: string
): string {
  const att = attachmentsContext?.trim()
    ? `\nAnexos (nomes; inferir escopo só se fizer sentido com a descrição):\n${attachmentsContext.trim()}\n`
    : '';
  return `
═══════════════════════════════════════════════════════════════
TAREFA (prioridade máxima — todo conteúdo gerado deve ser aderente a isto)
═══════════════════════════════════════════════════════════════
Título: ${title}
Descrição: ${description}
${taskType ? `Tipo Jira: ${taskType}` : 'Tipo Jira: (não informado)'}
${att}`;
}

function bugFocusBlock(): string {
  return `
═══════════════════════════════════════════════════════════════
FOCO PARA BUG
═══════════════════════════════════════════════════════════════
Priorize: verificação da correção, regressão em áreas relacionadas, cenários que reproduziam o defeito e validação de não recorrência.
`;
}

function detailLevelBlock(detailLevel: TestCaseDetailLevel): string {
  return `
Nível de detalhe dos passos nos casos de teste (quando aplicável): ${detailLevel}
- Resumido: 3–5 passos por caso.
- Padrão: 5–8 passos.
- Detalhado: 8+ passos, com dados e verificações intermediárias.
`;
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

/** Fase 1: somente estratégias. */
export async function buildStrategyOnlyPrompt(
  title: string,
  description: string,
  taskType: JiraTaskType | undefined,
  project: Project | null | undefined,
  attachmentsContext?: string,
  task?: JiraTask | null
): Promise<string> {
  const br = formatBusinessRulesForPrompt(project ?? null, task);
  const preamble = buildTestGenerationRolePreamble(title, description, br);
  const doc = await buildComplementaryDocumentSection(project ?? null);
  const bug = taskType === 'Bug' ? bugFocusBlock() : '';
  return `${preamble}

Você é um analista de QA sênior. Responda em português brasileiro.

Objetivo: gerar APENAS a lista de estratégias de teste para a tarefa abaixo.
Não gere casos de teste. Não gere cenários BDD. Não use markdown na saída JSON.

Regras:
- Cada estratégia deve ser específica para esta tarefa (evite frases genéricas como "testar tudo").
- Para cada estratégia explique qual risco ou requisito ela cobre.
- No máximo 6 estratégias.
- Campos por item: testType, description, howToExecute (array de passos curtos), tools (string, ferramentas separadas por vírgula).

${taskHeaderBlock(title, description, taskType, attachmentsContext)}
${bug}
${doc}

Responda somente com JSON válido no formato: {"strategy":[...]}.
`.trim();
}

/** Fase 2: somente BDD, usando estratégias já definidas. */
export async function buildBddOnlyPrompt(
  title: string,
  description: string,
  taskType: JiraTaskType | undefined,
  project: Project | null | undefined,
  strategies: TestStrategy[],
  attachmentsContext?: string,
  task?: JiraTask | null
): Promise<string> {
  const br = formatBusinessRulesForPrompt(project ?? null, task);
  const preamble = buildTestGenerationRolePreamble(title, description, br);
  const doc = await buildComplementaryDocumentSection(project ?? null);
  const bug = taskType === 'Bug' ? bugFocusBlock() : '';
  const strat = summarizeStrategiesForPrompt(strategies);
  return `${preamble}

Você é especialista em BDD. Responda em português brasileiro.

Objetivo: gerar APENAS cenários Gherkin em JSON (bddScenarios). Não gere estratégias nem casos de teste.

Regras Gherkin:
- Palavras-chave somente em português: Funcionalidade, Cenário (ou Esquema do Cenário), Dado, Quando, Então, E, Mas.
- Proibido: Given, When, Then, Feature, Scenario em inglês.
- Um passo por linha. Cubra caminho feliz, variações relevantes, erro/validação e permissão apenas se fizer sentido na descrição da tarefa.
- Tudo deve refletir o escopo da tarefa (título + descrição), não outras partes do projeto.

Estratégias já definidas (alinhe os cenários a estes tipos de teste):
${strat}

${taskHeaderBlock(title, description, taskType, attachmentsContext)}
${bug}
${doc}

Responda somente com JSON válido: {"bddScenarios":[{"title":"","gherkin":""},...]}.
`.trim();
}

/** Fase 3: somente casos de teste, rastreáveis a estratégias e BDD. */
export async function buildTestCasesOnlyPrompt(
  title: string,
  description: string,
  taskType: JiraTaskType | undefined,
  detailLevel: TestCaseDetailLevel,
  project: Project | null | undefined,
  strategies: TestStrategy[],
  bddScenarios: BddScenario[],
  attachmentsContext?: string,
  task?: JiraTask | null
): Promise<string> {
  const br = formatBusinessRulesForPrompt(project ?? null, task);
  const preamble = buildTestGenerationRolePreamble(title, description, br);
  const doc = await buildComplementaryDocumentSection(project ?? null);
  const bug = taskType === 'Bug' ? bugFocusBlock() : '';
  const strat = summarizeStrategiesForPrompt(strategies);
  const bdd = summarizeBddForPrompt(bddScenarios);
  const allowedTypes = strategies.map(s => s.testType).filter(Boolean);
  return `${preamble}

Você é um analista de QA sênior. Responda em português brasileiro.

Objetivo: gerar APENAS casos de teste em JSON (testCases). Não gere estratégias nem BDD.

Regras de aderência:
- Cada caso deve validar comportamento descrito na tarefa (título + descrição). Não invente módulos, APIs ou telas ausentes do texto.
- Cada caso deve listar em "strategies" um ou mais destes tipos EXATAMENTE como na lista permitida: ${allowedTypes.length ? allowedTypes.map(t => `"${t}"`).join(', ') : '(use strings coerentes com as estratégias fornecidas abaixo)'}.
- isAutomated: true somente para regressão repetitiva, fluxos estáveis ou checagens objetivas; false para exploratório, usabilidade ou cenários que exigem julgamento humano.

Campos por caso: description, steps[], expectedResult, strategies[], isAutomated, preconditions (string, pode ser vazia), testSuite, testEnvironment, priority (Baixa|Média|Alta|Urgente).

${detailLevelBlock(detailLevel)}

Estratégias (fonte de verdade para o campo strategies de cada caso):
${strat}

Cenários BDD de referência (alinhe cobertura; não copie texto sem adaptar a passos executáveis):
${bdd}

${taskHeaderBlock(title, description, taskType, attachmentsContext)}
${bug}
${doc}

Responda somente com JSON válido: {"testCases":[...]}.
`.trim();
}
