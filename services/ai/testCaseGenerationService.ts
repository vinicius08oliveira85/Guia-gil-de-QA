/**
 * Serviço de geração de casos de teste com IA para uma `JiraTask`.
 *
 * Wrapper fino sobre `getAIService().generateTestCasesForTask(...)`:
 * - reaproveita prompts em 3 fases, schema, retry e fallback Gemini→OpenAI;
 * - expõe a assinatura simplificada `generateTestCasesForTask(task) => Promise<TestCase[]>`
 *   e a versão completa `generateTestArtifactsForTask(task) => { testCases, strategy, bddScenarios }`;
 * - mantém cache em duas camadas: memória (rápido, síncrono) + IndexedDB (sobrevive
 *   a reload, compartilhado entre abas). Erros na camada persistida nunca quebram o fluxo.
 */

import type {
  BddScenario,
  JiraTask,
  Project,
  TestCase,
  TestCaseDetailLevel,
  TestStrategy,
} from '../../types';
import { hashString } from '../../utils/hash';
import { logger } from '../../utils/logger';
import { getAIService } from './aiServiceFactory';
import {
  clearPersistedCache,
  deletePersistedCacheEntry,
  loadPersistedCacheEntry,
  savePersistedCacheEntry,
} from './testCaseGenerationCachePersistence';
import { migrateTestCase, resolveExecutionKindFromRecord } from '../../utils/testCaseMigration';

const LOGGER_CONTEXT = 'testCaseGenerationService';

/** TTL do cache (5 minutos), aplicado a ambas as camadas. */
const CACHE_TTL_MS = 1000 * 60 * 5;

/** Conjunto completo de artefatos gerados pela IA para uma tarefa. */
export interface TestGenerationArtifacts {
  testCases: TestCase[];
  strategy: TestStrategy[];
  bddScenarios: BddScenario[];
  /**
   * Hash do snapshot da tarefa que originou esta geração.
   * Persistir em `task.testCasesSnapshotHash` para detectar `isTestCasesOutdated`
   * mesmo após reload (quando o cache em memória já se foi).
   */
  snapshotHash: string;
  /** ISO date da geração. Persistir em `task.testCasesGeneratedAt`. */
  generatedAt: string;
}

interface CacheEntry {
  hash: string;
  expiresAt: number;
  artifacts: TestGenerationArtifacts;
}

const cache = new Map<string, CacheEntry>();

export interface GenerateTestCasesOptions {
  /** Nível de detalhe dos passos. Default: 'Padrão'. */
  detailLevel?: TestCaseDetailLevel;
  /** Projeto opcional — usado para regras de negócio e contexto de documentos. */
  project?: Project | null;
  /** Texto livre com nomes/legendas de anexos da tarefa, repassado ao prompt. */
  attachmentsContext?: string;
  /** Quando `true`, ignora o cache e força nova geração via IA. */
  forceRefresh?: boolean;
  /**
   * Quando `true`, força a IA a regenerar os cenários BDD (ignora `task.bddScenarios`).
   * Default: `false` — usa os BDDs existentes na tarefa.
   */
  regenerateBdd?: boolean;
}

/**
 * Gera casos de teste detalhados para uma `JiraTask` usando IA.
 *
 * Conveniência sobre `generateTestArtifactsForTask`: descarta `strategy` e
 * `bddScenarios`, retornando apenas o array de casos de teste já normalizado.
 *
 * @throws Error se `task.title` ou `task.description` estiverem vazios.
 */
export async function generateTestCasesForTask(
  task: JiraTask,
  options: GenerateTestCasesOptions = {}
): Promise<TestCase[]> {
  const { testCases } = await generateTestArtifactsForTask(task, options);
  return testCases;
}

/**
 * Gera o conjunto completo de artefatos de teste (estratégias, BDDs e casos)
 * para uma `JiraTask` usando IA.
 *
 * Delega para o `AIService` ativo (Gemini com fallback automático para OpenAI),
 * aplica cache em memória por `task.id` com invalidação por hash de snapshot
 * (título, descrição, tipo, BDDs e regras de negócio vinculadas) e garante que
 * cada `TestCase` retornado tenha `id` único e `status: 'Not Run'`.
 *
 * @throws Error se `task.title` ou `task.description` estiverem vazios.
 */
export async function generateTestArtifactsForTask(
  task: JiraTask,
  options: GenerateTestCasesOptions = {}
): Promise<TestGenerationArtifacts> {
  validateTaskInput(task);

  const snapshotHash = computeSnapshotHash(task, options);
  const { forceRefresh = false, regenerateBdd = false } = options;

  if (!forceRefresh) {
    let cached = readCache(task.id, snapshotHash);
    if (!cached) {
      cached = await warmCacheFromPersistence(task.id, snapshotHash);
    }
    if (cached) {
      logger.info(
        `Artefatos de teste retornados do cache para a tarefa ${task.id}`,
        LOGGER_CONTEXT,
        { taskId: task.id, count: cached.testCases.length }
      );
      return cached;
    }
  }

  logger.info(
    `Gerando artefatos de teste com IA para a tarefa ${task.id}`,
    LOGGER_CONTEXT,
    { taskId: task.id, type: task.type, forceRefresh, regenerateBdd }
  );

  try {
    const aiService = getAIService();
    const detailLevel: TestCaseDetailLevel = options.detailLevel ?? 'Padrão';
    const bddInput = regenerateBdd ? undefined : task.bddScenarios;

    const result = await aiService.generateTestCasesForTask(
      task.title,
      task.description,
      bddInput,
      detailLevel,
      task.type,
      options.project ?? null,
      task,
      options.attachmentsContext
    );

    const artifacts: TestGenerationArtifacts = {
      testCases: normalizeTestCases(result.testCases as unknown[]),
      strategy: Array.isArray(result.strategy) ? result.strategy : [],
      bddScenarios: Array.isArray(result.bddScenarios) ? result.bddScenarios : [],
      snapshotHash,
      generatedAt: new Date().toISOString(),
    };

    writeCache(task.id, snapshotHash, artifacts);

    logger.info(
      `Artefatos de teste gerados para a tarefa ${task.id}`,
      LOGGER_CONTEXT,
      {
        taskId: task.id,
        testCases: artifacts.testCases.length,
        strategies: artifacts.strategy.length,
        bddScenarios: artifacts.bddScenarios.length,
      }
    );

    return artifacts;
  } catch (error) {
    logger.error(
      `Falha ao gerar artefatos de teste para a tarefa ${task.id}`,
      LOGGER_CONTEXT,
      error
    );
    throw error;
  }
}

/**
 * Indica se os casos de teste em cache (ou persistidos em `task`) estão
 * desatualizados em relação ao snapshot atual.
 *
 * Ordem de verificação:
 * 1. Cache em memória (mais rápido, válido durante a sessão).
 * 2. `task.testCasesSnapshotHash` (sobrevive a reload — preenchido pela UI
 *    após cada geração bem-sucedida).
 * 3. Sem nenhum dos dois → considera-se desatualizado.
 */
export function isTestCasesOutdated(task: JiraTask): boolean {
  const currentHash = computeSnapshotHash(task);

  const entry = cache.get(task.id);
  if (entry && entry.expiresAt >= Date.now()) {
    return entry.hash !== currentHash;
  }

  if (task.testCasesSnapshotHash) {
    return task.testCasesSnapshotHash !== currentHash;
  }

  return true;
}

/**
 * Lê os artefatos em cache (se válidos) sem disparar nova geração via IA.
 * Útil para a UI exibir os últimos artefatos conhecidos enquanto decide
 * se chama `generateTestArtifactsForTask` novamente.
 */
export function getCachedTestArtifacts(task: JiraTask): TestGenerationArtifacts | null {
  return readCache(task.id, computeSnapshotHash(task));
}

/**
 * Remove uma entrada do cache (ou todas, se `taskId` não for informado).
 * Limpa as duas camadas (memória + IndexedDB). A camada persistida é limpa em
 * fire-and-forget — falhas são logadas mas não bloqueiam o caller.
 *
 * Útil ao editar/excluir a tarefa, ou ao trocar o provedor de IA.
 */
export function invalidateTestCaseCache(taskId?: string): void {
  if (!taskId) {
    cache.clear();
    logger.info('Cache de casos de teste limpo integralmente', LOGGER_CONTEXT);
    void clearPersistedCache();
    return;
  }
  if (cache.delete(taskId)) {
    logger.info(`Cache de casos de teste invalidado: ${taskId}`, LOGGER_CONTEXT);
  }
  void deletePersistedCacheEntry(taskId);
}

function validateTaskInput(task: JiraTask): void {
  if (!task?.title?.trim()) {
    const message = 'Tarefa sem título: não é possível gerar casos de teste.';
    logger.error(message, LOGGER_CONTEXT, { taskId: task?.id });
    throw new Error(message);
  }
  if (!task?.description?.trim()) {
    const message = 'Tarefa sem descrição: não é possível gerar casos de teste.';
    logger.error(message, LOGGER_CONTEXT, { taskId: task.id });
    throw new Error(message);
  }
}

/**
 * Calcula um hash determinístico do conteúdo da tarefa que influencia a geração.
 * Mudanças em título, descrição, tipo, BDDs, regras vinculadas, `detailLevel` ou
 * `regenerateBdd` invalidam o cache.
 */
function computeSnapshotHash(task: JiraTask, options: GenerateTestCasesOptions = {}): string {
  const bddSignature = (task.bddScenarios ?? [])
    .map((scenario: BddScenario) => `${scenario.id}:${scenario.gherkin}`)
    .join('|');

  const linkedIds = [...(task.linkedBusinessRuleIds ?? [])].sort().join(',');
  const linkedCategories = [...(task.linkedBusinessRuleCategories ?? [])]
    .sort()
    .join(',');

  const payload = [
    task.id,
    task.title,
    task.description,
    task.type,
    bddSignature,
    linkedIds,
    linkedCategories,
    options.detailLevel ?? 'Padrão',
    options.regenerateBdd ? 'regenBdd' : 'keepBdd',
  ].join('||');

  return hashString(payload);
}

function readCache(taskId: string, hash: string): TestGenerationArtifacts | null {
  const entry = cache.get(taskId);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    cache.delete(taskId);
    return null;
  }

  if (entry.hash !== hash) {
    logger.warn(
      `Snapshot da tarefa ${taskId} mudou; cache de artefatos de teste invalidado`,
      LOGGER_CONTEXT
    );
    cache.delete(taskId);
    return null;
  }

  return entry.artifacts;
}

function writeCache(taskId: string, hash: string, artifacts: TestGenerationArtifacts): void {
  const expiresAt = Date.now() + CACHE_TTL_MS;
  cache.set(taskId, { hash, expiresAt, artifacts });
  void savePersistedCacheEntry({ taskId, hash, expiresAt, artifacts });
}

/**
 * @internal Reservado a testes que precisam simular "reload da aba"
 * (memória zerada, mas IndexedDB persistido intacto). Não usar em código de produção.
 */
export function __resetInMemoryCacheForTests(): void {
  cache.clear();
}

/**
 * Tenta popular o cache em memória a partir do IndexedDB.
 * Retorna os artefatos se o entry persistido for válido para o `expectedHash`,
 * ou `null` em qualquer outro caso (ausência, expirado, hash divergente, erro).
 */
async function warmCacheFromPersistence(
  taskId: string,
  expectedHash: string
): Promise<TestGenerationArtifacts | null> {
  const entry = await loadPersistedCacheEntry(taskId);
  if (!entry) return null;

  if (entry.hash !== expectedHash) {
    logger.warn(
      `Snapshot persistido da tarefa ${taskId} divergiu; descartando entry`,
      LOGGER_CONTEXT
    );
    void deletePersistedCacheEntry(taskId);
    return null;
  }

  cache.set(taskId, {
    hash: entry.hash,
    expiresAt: entry.expiresAt,
    artifacts: entry.artifacts,
  });
  logger.info(`Cache aquecido a partir do IndexedDB para a tarefa ${taskId}`, LOGGER_CONTEXT);
  return entry.artifacts;
}

/** Texto mínimo quando a IA omite um campo obrigatório do roteiro (ação / resultado esperado). */
const PLACEHOLDER_ACTION = '[Ação necessária não gerada — edite o roteiro]';
const PLACEHOLDER_EXPECTED =
  '[Resultado esperado não gerado — edite o roteiro]';

/**
 * Alguns modelos devolvem `\` + `n` literal em vez de newline dentro da string (após JSON.parse).
 * Substitui apenas onde o trecho seguinte indica lista numerada ou marcador (`-` / `•`), para não
 * alterar sequências como `\n` em `C:\notes\...`.
 */
function decodeMisescapedNewlinesWhenFlat(value: string): string {
  let v = value.replace(/\\n(?=\s*\d+\.\s)/g, '\n');
  v = v.replace(/\\n(?=\s*[•\-])/gu, '\n');
  return v;
}

/**
 * Preserva quebras de linha internas vindas da IA: normaliza finais de linha (CRLF, CR, separadores
 * Unicode), corrige `\n` literais típicos de JSON mal gerado, e faz trim só nas extremidades.
 * Nunca colapsa espaços ou newlines no meio do texto (`replace(/\s+/g, ' ')` é propositalmente evitado).
 *
 * @remarks
 * **Atenção**: Para a UI de "uma linha", o componente de frontend deve utilizar CSS truncate.
 * Esta função preserva os \n para que, em modais de detalhe, a estrutura de lista 
 * numerada seja mantida, enquanto na listagem compacta o CSS cuida da exibição em linha única.
 *
 * **Ponto único de normalização** para `action`, `parameters` e `expectedResult` após o parse do
 * JSON da IA. Serviços (`geminiService` / `openaiService`) não devem aplicar `.trim()` nesses
 * campos — evita dupla normalização e preserva intenção até aqui. É crítica para o roteiro
 * legível na UI (listas numeradas, bullets `•`). Mantenha testes cobrindo literais `\\n`,
 * caminhos Windows, CRLF e campos vazios (ver `testCaseGenerationService.test.ts`).
 *
 * **Desempenho**: custo O(n) em relação ao tamanho da string (poucas passagens lineares e regexes
 * ancoradas em `decodeMisescapedNewlinesWhenFlat`). Evite encadear mais transformações pesadas
 * aqui ou chamar esta função em loop quente sem necessidade; se precisar de formato “uma linha”
 * para exibição, faça isso na camada de UI (CSS `truncate` / `line-clamp`) ou num adaptador de
 * view, e não colapsando newlines nesta função.
 */
function normalizeAiMultilineField(value: string): string {
  let v = value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u2028/g, '\n')
    .replace(/\u2029/g, '\n');
  v = decodeMisescapedNewlinesWhenFlat(v);
  return v.trim();
}

/**
 * Normaliza saída da IA para o roteiro: `migrateTestCase` cobre legado;
 * na geração, `action`, `parameters` e `expectedResult` são sempre strings não vazias
 * (com placeholders quando necessário), `observedResult` é sempre "" e o status é `Not Run`.
 */
function normalizeTestCases(raw: unknown[]): TestCase[] {
  if (!Array.isArray(raw)) return [];

  const baseTimestamp = Date.now();
  return raw.map((item, index) => {
    const r = item as Record<string, unknown>;
    const id =
      typeof r.id === 'string' && r.id.trim()
        ? r.id.trim()
        : generateTestCaseId(baseTimestamp, index);
    const { observedResult: _ignored, ...restForMigrate } = r;
    const migrated = migrateTestCase({ ...restForMigrate, id });

    const action =
      normalizeAiMultilineField(String(migrated.action ?? '')) || PLACEHOLDER_ACTION;
    const parameters =
      normalizeAiMultilineField(String(migrated.parameters ?? '')) || '—';
    const expectedResult =
      normalizeAiMultilineField(String(migrated.expectedResult ?? '')) ||
      PLACEHOLDER_EXPECTED;

    const kindFromRaw = resolveExecutionKindFromRecord(r);
    return {
      ...migrated,
      action,
      parameters,
      expectedResult,
      observedResult: '',
      status: 'Not Run' as const,
      executionKind: migrated.executionKind ?? kindFromRaw ?? 'manual',
    };
  });
}

/**
 * Gera um ID único usando `crypto.randomUUID()` quando disponível
 * (browser moderno / Node 19+) com fallback para o padrão `tc-${ts}-${index}`
 * já adotado em outros pontos do projeto.
 */
function generateTestCaseId(baseTimestamp: number, index: number): string {
  const cryptoRef =
    typeof globalThis !== 'undefined'
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;

  if (cryptoRef?.randomUUID) {
    try {
      return cryptoRef.randomUUID();
    } catch {
      // segue para o fallback
    }
  }
  return `tc-${baseTimestamp}-${index}`;
}
