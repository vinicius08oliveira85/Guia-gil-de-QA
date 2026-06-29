import type { TestCase } from '../types';
import { coerceOptionalString, coerceString } from './coerceString';

const VALID_STATUS: TestCase['status'][] = ['Not Run', 'Passed', 'Failed', 'Blocked'];

/**
 * Interpreta `executionKind` / legado `isAutomated` a partir de JSON da IA ou persistência.
 * Único ponto de regra compartilhado com `migrateTestCase` e mapeamento pós-parse (OpenAI/Gemini).
 */
export function resolveExecutionKindFromRecord(
  o: Record<string, unknown>
): TestCase['executionKind'] | undefined {
  const k = o.executionKind;
  if (k === 'manual' || k === 'automated' || k === 'mixed') return k;
  if (typeof k === 'string') {
    const n = k.toLowerCase().trim();
    if (n === 'manual' || n.startsWith('manua')) return 'manual';
    if (n === 'automated' || n === 'automático' || n.startsWith('automat')) return 'automated';
    if (n === 'mixed' || n.includes('misto')) return 'mixed';
  }
  if (o.isAutomated === true) return 'automated';
  if (o.isAutomated === false) return 'manual';
  return undefined;
}

function pickOptionalString(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

/** Ambiente estruturado ou linha `Ambiente:` em parâmetros (legado/importação). */
export function getTestCaseEnvironment(tc: TestCase): string | undefined {
  const direct = coerceOptionalString(tc.environment);
  if (direct) return direct;
  const parameters = coerceString(tc.parameters);
  return parameters.match(/Ambiente:\s*([^\n]+)/i)?.[1]?.trim();
}

/** Suíte estruturada ou linha `Suíte:` em parâmetros. */
export function getTestCaseSuite(tc: TestCase): string | undefined {
  const direct = coerceOptionalString(tc.suite);
  if (direct) return direct;
  const parameters = coerceString(tc.parameters);
  return parameters.match(/Suíte:\s*([^\n]+)/i)?.[1]?.trim();
}

/**
 * Heurística para filtros/métricas que antes usavam `isAutomated`.
 * Se `executionKind` estiver definido, tem precedência sobre o texto.
 */
export function testCaseLooksAutomated(tc: TestCase): boolean {
  const kind = tc.executionKind;
  if (kind === 'automated') return true;
  if (kind === 'manual') return false;
  if (kind === 'mixed') return true;
  const blob = `${tc.action}\n${tc.parameters}`;
  return /\b(automat|selenium|cypress|playwright|robot\s*framework|postman|jmeter|api\s*test)\b/i.test(
    blob
  );
}

/** Ordem de alternância ao clicar na badge de tipo de execução. */
export const EXECUTION_KIND_CYCLE: NonNullable<TestCase['executionKind']>[] = [
  'manual',
  'automated',
  'mixed',
];

export type ExecutionKindBadgeVariant = 'neutral' | 'info' | 'warning';

/** Rótulo e variante visual da badge de tipo de execução (explícito ou inferido). */
export function getExecutionKindBadgeDisplay(tc: TestCase): {
  label: string;
  variant: ExecutionKindBadgeVariant;
} {
  const k = tc.executionKind;
  if (k === 'automated') return { label: 'Automatizado', variant: 'info' };
  if (k === 'mixed') return { label: 'Misto', variant: 'warning' };
  if (k === 'manual') return { label: 'Manual', variant: 'neutral' };
  const inferredAuto = testCaseLooksAutomated(tc);
  if (inferredAuto) return { label: 'Automatizado (inferido)', variant: 'info' };
  return { label: 'Manual (inferido)', variant: 'neutral' };
}

/** Tipo efetivo considerando inferência pelo texto quando `executionKind` está ausente. */
export function resolveEffectiveExecutionKind(
  tc: Pick<TestCase, 'executionKind' | 'action' | 'parameters'>
): NonNullable<TestCase['executionKind']> {
  if (tc.executionKind) return tc.executionKind;
  return testCaseLooksAutomated(tc as TestCase) ? 'automated' : 'manual';
}

/** Próximo valor ao alternar tipo de execução (manual → automatizado → misto). */
export function getNextExecutionKind(
  tc: Pick<TestCase, 'executionKind' | 'action' | 'parameters'>
): NonNullable<TestCase['executionKind']> {
  const effective = resolveEffectiveExecutionKind(tc);
  const idx = EXECUTION_KIND_CYCLE.indexOf(effective);
  const nextIdx = (idx + 1) % EXECUTION_KIND_CYCLE.length;
  return EXECUTION_KIND_CYCLE[nextIdx]!;
}

function isValidStatus(value: unknown): value is TestCase['status'] {
  return typeof value === 'string' && (VALID_STATUS as string[]).includes(value);
}

function normalizeLegacyStatus(value: unknown): TestCase['status'] {
  if (isValidStatus(value)) return value;
  return 'Not Run';
}

/** Detecta objeto persistido no formato antigo (antes do roteiro action/parameters). */
export function isLegacyTestCaseShape(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  const actionStr = typeof o.action === 'string' ? o.action.trim() : '';
  // Qualquer ação não vinda do legado classifica como roteiro novo (parâmetros podem ser preenchidos depois).
  if (actionStr.length > 0) return false;
  return true;
}

function buildLegacyAction(o: Record<string, unknown>): string {
  const fromNewField = typeof o.action === 'string' ? o.action.trim() : '';
  if (fromNewField) return fromNewField;
  const description = typeof o.description === 'string' ? o.description.trim() : '';
  const steps = Array.isArray(o.steps) ? o.steps.map(s => String(s).trim()).filter(Boolean) : [];
  if (steps.length === 0) return description || '—';
  const numbered = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return description ? `${description}\n\n${numbered}` : numbered;
}

function buildLegacyParameters(o: Record<string, unknown>): string {
  const parts: string[] = [];
  const pre =
    typeof o.preconditions === 'string'
      ? o.preconditions.trim()
      : typeof (o as { precondition?: string }).precondition === 'string'
        ? String((o as { precondition?: string }).precondition).trim()
        : '';
  if (pre) parts.push(`Pré-condições: ${pre}`);
  const suite = typeof o.testSuite === 'string' ? o.testSuite.trim() : '';
  if (suite) parts.push(`Suíte: ${suite}`);
  const env = typeof o.testEnvironment === 'string' ? o.testEnvironment.trim() : '';
  if (env) parts.push(`Ambiente: ${env}`);
  const strat =
    Array.isArray(o.strategies) && o.strategies.length > 0
      ? o.strategies.map(s => String(s)).join(', ')
      : '';
  if (strat) parts.push(`Estratégias (legado): ${strat}`);
  return parts.length > 0 ? parts.join('\n') : '—';
}

/**
 * Converte um caso legado ou parcial (ex.: importação) para o formato atual do roteiro.
 */
export function migrateTestCase(raw: unknown): TestCase {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `tc-${Date.now()}`,
      action: '—',
      parameters: '—',
      expectedResult: '',
      observedResult: '',
      status: 'Not Run',
    };
  }

  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === 'string' && o.id.trim()
      ? o.id.trim()
      : `tc-migrate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const optionalEnv = pickOptionalString(o, ['environment', 'testEnvironment']);
  const optionalSuite = pickOptionalString(o, ['suite', 'testSuite']);
  const optionalKind = resolveExecutionKindFromRecord(o);

  if (!isLegacyTestCaseShape(raw)) {
    const base: TestCase = {
      id,
      action: typeof o.action === 'string' && o.action.trim() ? o.action : '—',
      parameters: typeof o.parameters === 'string' ? o.parameters : '—',
      expectedResult: typeof o.expectedResult === 'string' ? o.expectedResult : '',
      observedResult: typeof o.observedResult === 'string' ? o.observedResult : '',
      status: normalizeLegacyStatus(o.status),
    };
    if (optionalKind) base.executionKind = optionalKind;
    if (optionalEnv) base.environment = optionalEnv;
    if (optionalSuite) base.suite = optionalSuite;
    return base;
  }

  const base: TestCase = {
    id,
    action: buildLegacyAction(o),
    parameters: buildLegacyParameters(o),
    expectedResult: typeof o.expectedResult === 'string' ? o.expectedResult : '',
    observedResult: typeof o.observedResult === 'string' ? o.observedResult : '',
    status: normalizeLegacyStatus(o.status),
  };
  if (optionalKind) base.executionKind = optionalKind;
  if (optionalEnv) base.environment = optionalEnv;
  if (optionalSuite) base.suite = optionalSuite;
  return base;
}

export function migrateTestCases(testCases: unknown[]): TestCase[] {
  if (!Array.isArray(testCases)) return [];
  return testCases.map(migrateTestCase);
}

/** @deprecated Preferir `migrateTestCase`; mantido para chamadas antigas. */
export function normalizeExecutedStrategy(_executedStrategy?: string | string[]): string[] {
  return [];
}
