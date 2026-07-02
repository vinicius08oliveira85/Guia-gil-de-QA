import type { BddScenario, JiraTask, JiraTaskType, Project, TestCaseDetailLevel, TestStrategy } from '../../types';
import { getDocumentContext } from './documentContextService';
import type { TaskAiContext } from './taskAiContext';
import {
  formatBusinessRulesForPrompt,
  summarizeBddForPrompt,
  summarizeStrategiesForPrompt,
} from './promptUtils';

/**
 * Regras de formatação visual dos campos do roteiro (casos de teste).
 * Mantidas alinhadas às descrições de schema em `geminiService` / mensagem de sistema em `openaiService`.
 */
export const TEST_CASE_VISUAL_FORMAT_INSTRUCTIONS = [
  '**action** (*Ação necessária*): OBRIGATÓRIO usar lista numerada (`1.`, `2.`, `3.` …) com **quebras de linha reais** (`\\n` no JSON da string) entre cada passo — nunca um único parágrafo contínuo quando houver mais de um passo.',
  '**parameters** (*Parâmetros necessários*): com **vários** itens (massas, pré-condições, dados), use **bullet points com o caractere •** (U+2022), **um item por linha**. Item único pode ser uma linha sem marcador.',
  '**expectedResult** (*Resultado esperado*): com **vários** critérios de verificação, use **bullet points com •**, **um critério por linha**. Critério único pode ser uma linha só.',
].join('\n');

/** Rodapés JSON das três fases (evita divergência de texto entre funções). */
export const PHASE_JSON_FOOTERS = {
  strategy: `Responda somente com JSON válido no formato: {"strategy":[...]}.`,
  bddScenarios: `Responda somente com JSON válido: {"bddScenarios":[{"title":"","gherkin":""},...]}.`,
  testCases: `Responda somente com JSON válido: {"testCases":[...]}.`,
} as const;

/** Bloco pronto para injetar em prompts de geração de casos de teste. */
export const TEST_CASE_VISUAL_FORMAT_PROMPT_SECTION = `
═══════════════════════════════════════════════════════════════
FORMATAÇÃO VISUAL OBRIGATÓRIA (roteiro legível e validável)
═══════════════════════════════════════════════════════════════
${TEST_CASE_VISUAL_FORMAT_INSTRUCTIONS}
`.trim();

/** Tamanho máximo do trecho de especificação injetado após o bloco da tarefa (evita documento “engolir” a tarefa). */
export const TASK_GEN_MAX_DOC_CHARS = 3200;

/** Reexporta utilitários de prompt usados por testes e serviços de IA. */
export {
  BUSINESS_RULES_PROMPT_MAX_CHARS,
  formatBusinessRulesForPrompt,
  summarizeBddForPrompt,
  summarizeStrategiesForPrompt,
} from './promptUtils';

/**
 * Instrução unificada de análise (título, descrição, formulários, imagens, regras vinculadas).
 */
export function buildTestGenerationRolePreamble(ctx: TaskAiContext): string {
  const rb = ctx.businessRulesBlock.trim();
  const emptyRulesMsg =
    '\n\n### REGRAS DE NEGÓCIO APLICÁVEIS ###\n' +
    '(nenhuma regra vinculada; use título, descrição, formulários anexados e imagens.)\n';
  const rulesPart = rb ? `\n\n${rb}\n` : emptyRulesMsg;
  const imageNote =
    ctx.imageParts.length > 0
      ? ' Imagens anexadas a este prompt devem ser analisadas visualmente (telas, fluxos, mensagens e campos visíveis).'
      : '';
  return (
    `Analise o bloco CONTEXTO DA TAREFA abaixo (título, descrição, formulários anexados via API Jira, imagens e anexos quando constarem). ` +
    `Use as REGRAS DE NEGÓCIO vinculadas somente quando a seção delimitada estiver preenchida; não invente regras fora do escopo da tarefa.${rulesPart}\n` +
    `Use todas as fontes com peso equivalente; não invente escopo fora delas.${imageNote} ` +
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


/** Bloco unificado de contexto da tarefa para as três fases de geração. */
export function buildTaskContextBlock(ctx: TaskAiContext): string {
  const att = ctx.attachmentsContext?.trim()
    ? `\nAnexos (não-imagem): ${ctx.attachmentsContext.trim()}`
    : '';
  const imagesBlock =
    ctx.imageSummary.trim() && !ctx.imageSummary.startsWith('(nenhuma')
      ? `\nImagens para análise visual:\n${ctx.imageSummary}`
      : '\nImagens para análise visual: (nenhuma)';
  return `
═══════════════════════════════════════════════════════════════
CONTEXTO DA TAREFA (analisar tudo antes de gerar)
═══════════════════════════════════════════════════════════════
Título: ${ctx.title}
Descrição: ${ctx.description}
Formulários anexados (API Jira — campos do portal/Proforma):
${ctx.attachedFormsContext}
${imagesBlock}
${att}
${ctx.taskType ? `Tipo Jira: ${ctx.taskType}` : 'Tipo Jira: (não informado)'}`;
}

function bugFocusBlock(): string {
  return `
═══════════════════════════════════════════════════════════════
FOCO PARA BUG
═══════════════════════════════════════════════════════════════
Priorize: verificação da correção, regressão em áreas relacionadas, cenários que reproduziam o defeito e validação de não recorrência.
`;
}

const DETAIL_LEVEL_BLOCKS = new Map<TestCaseDetailLevel, string>([
  [
    'Resumido',
    `
═══════════════════════════════════════════════════════════════
Nível de detalhe: **Resumido** (campo JSON \`action\` / **Ação necessária**)
═══════════════════════════════════════════════════════════════
- Gere **poucos** passos numerados (\`1.\`, \`2.\`, \`3.\` …), sempre com **quebra de linha real** (\`\\n\`) entre cada passo.
- Linguagem **objetiva** e direta; evite passos redundantes ou verificações longas.
- **parameters** e **expectedResult**: texto conciso; use linhas iniciadas por **•** (U+2022) somente quando houver **vários** itens distintos (um bullet por linha).
`.trim(),
  ],
  [
    'Estruturado',
    `
═══════════════════════════════════════════════════════════════
Nível de detalhe: **Estruturado** (campo JSON \`action\` / **Ação necessária**)
═══════════════════════════════════════════════════════════════
- **action**: roteiro **completo** com passos numerados (\`1.\`, \`2.\`, …) e **quebra de linha real** (\`\\n\`) entre **cada** passo (nunca um único parágrafo contínuo quando houver mais de um passo).
- Inclua **verificações intermediárias detalhadas** ao longo do roteiro (o que conferir após passos críticos, estados esperados, mensagens ou dados intermediários).
- **parameters** e **expectedResult**: com **vários** pontos, cada linha relevante deve começar com **•** (U+2022), **um ponto por linha** (alinhado às regras globais do roteiro).
- Aplicar **rigorosamente** cada item de \`TEST_CASE_VISUAL_FORMAT_INSTRUCTIONS\` (o mesmo texto do bloco **FORMATAÇÃO VISUAL OBRIGATÓRIA** já incluído acima neste prompt); não resuma nem omita essas regras na prática.
`.trim(),
  ],
]);

/** Bloco de prompt por nível de detalhe dos casos de teste (exportado para testes). */
export function detailLevelBlock(detailLevel: TestCaseDetailLevel): string {
  return DETAIL_LEVEL_BLOCKS.get(detailLevel) ?? DETAIL_LEVEL_BLOCKS.get('Estruturado')!;
}

/** Fase 1: somente estratégias. */
export async function buildStrategyOnlyPrompt(
  ctx: TaskAiContext,
  project: Project | null | undefined
): Promise<string> {
  const preamble = buildTestGenerationRolePreamble(ctx);
  const doc = await buildComplementaryDocumentSection(project ?? null);
  const bug = ctx.taskType === 'Bug' ? bugFocusBlock() : '';
  return `${preamble}

Você é um analista de QA sênior. Responda em português brasileiro.

Objetivo: gerar APENAS a lista de estratégias de teste para a tarefa abaixo.
Não gere casos de teste. Não gere cenários BDD. Não use markdown na saída JSON.

Regras:
- Cada estratégia deve ser específica para esta tarefa (evite frases genéricas como "testar tudo").
- Para cada estratégia explique qual risco ou requisito ela cobre.
- No máximo 6 estratégias.
- Campos por item: testType, description, howToExecute (array de passos curtos), tools (string, ferramentas separadas por vírgula).

${buildTaskContextBlock(ctx)}
${bug}
${doc}

${PHASE_JSON_FOOTERS.strategy}
`.trim();
}

/** Fase 2: somente BDD, usando estratégias já definidas. */
export async function buildBddOnlyPrompt(
  ctx: TaskAiContext,
  project: Project | null | undefined,
  strategies: TestStrategy[]
): Promise<string> {
  const preamble = buildTestGenerationRolePreamble(ctx);
  const doc = await buildComplementaryDocumentSection(project ?? null);
  const bug = ctx.taskType === 'Bug' ? bugFocusBlock() : '';
  const strat = summarizeStrategiesForPrompt(strategies);
  return `${preamble}

Você é especialista em BDD. Responda em português brasileiro.

Objetivo: gerar APENAS cenários Gherkin em JSON (bddScenarios). Não gere estratégias nem casos de teste.

Regras Gherkin:
- Palavras-chave somente em português: Funcionalidade, Cenário (ou Esquema do Cenário), Dado, Quando, Então, E, Mas.
- Proibido: Given, When, Then, Feature, Scenario em inglês.
- Um passo por linha. Cubra caminho feliz, variações relevantes, erro/validação e permissão apenas se fizer sentido no contexto da tarefa.
- Tudo deve refletir o escopo da tarefa (título, descrição, formulários e imagens), não outras partes do projeto.

Estratégias já definidas (alinhe os cenários a estes tipos de teste):
${strat}

${buildTaskContextBlock(ctx)}
${bug}
${doc}

${PHASE_JSON_FOOTERS.bddScenarios}
`.trim();
}

/** Fase 3: somente casos de teste, rastreáveis a estratégias e BDD. */
export async function buildTestCasesOnlyPrompt(
  ctx: TaskAiContext,
  detailLevel: TestCaseDetailLevel,
  project: Project | null | undefined,
  strategies: TestStrategy[],
  bddScenarios: BddScenario[]
): Promise<string> {
  const preamble = buildTestGenerationRolePreamble(ctx);
  const doc = await buildComplementaryDocumentSection(project ?? null);
  const bug = ctx.taskType === 'Bug' ? bugFocusBlock() : '';
  const strat = summarizeStrategiesForPrompt(strategies);
  const bdd = summarizeBddForPrompt(bddScenarios);
  const allowedTypes = strategies.map(s => s.testType).filter(Boolean);
  return `${preamble}

Você é um analista de QA sênior. Responda em português brasileiro.

Objetivo: gerar APENAS casos de teste em JSON (testCases). Não gere estratégias nem BDD.

Regras de aderência (roteiro padronizado — use exatamente estes nomes de chave JSON):
- **action** (*Ação necessária*): roteiro executável em um único string (sem array de passos). **Sempre** formato lista numerada (\`1.\`, \`2.\`, …) com quebra de linha real entre cada passo.
- **parameters** (*Parâmetros necessários*): massa de dados, pré-condições, inputs e contexto técnico. Com **vários** itens, cada linha DEVE começar com **•** (bullet Unicode). Se não houver nada específico, use exatamente o texto "—".
- **expectedResult** (*Resultado esperado*): critérios de sucesso; com **várias** verificações, cada linha DEVE começar com **•**.
- **Proibido**: preencher **Resultado Obtido** / \`observedResult\` / "resultado obtido" / qualquer campo equivalente — isso é exclusivo do executor humano na aplicação. Não inclua essas chaves no JSON.
- Não invente módulos, APIs ou telas ausentes do contexto da tarefa ou dos BDD.

${TEST_CASE_VISUAL_FORMAT_PROMPT_SECTION}

Campos por objeto em testCases (obrigatórios, todos string): apenas \`action\`, \`parameters\` e \`expectedResult\`. Opcionalmente \`executionKind\`, \`environment\`, \`suite\` quando fizer sentido.

Tipos de estratégia já definidos (use apenas como referência de cobertura; não repita como campo no JSON): ${allowedTypes.length ? allowedTypes.map(t => `"${t}"`).join(', ') : '(alinhe mentalmente às estratégias abaixo).'}.

${detailLevelBlock(detailLevel)}

Estratégias (fonte de verdade para o campo strategies de cada caso):
${strat}

Cenários BDD de referência (alinhe cobertura; não copie texto sem adaptar a passos executáveis):
${bdd}

${buildTaskContextBlock(ctx)}
${bug}
${doc}

${PHASE_JSON_FOOTERS.testCases}
`.trim();
}
