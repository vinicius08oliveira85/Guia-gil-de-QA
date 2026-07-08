import type { TestCase } from '../types';
import { getTestCaseEnvironment, getTestCaseSuite } from './testCaseMigration';

function collapseOneLine(s: string): string {
  return s.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function isPlaceholderOrEmptyExpected(s: string): boolean {
  const t = s.trim();
  if (!t || t === '—') return true;
  if (/^\[/i.test(t) && /não gerado|nao gerado/i.test(t)) return true;
  return false;
}

function clampListTitle(s: string, max = 118): string {
  const t = s.trim();
  if (!t) return '';
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
  return `${base}…`;
}

interface GetTestCaseListTitleOptions {
  truncate?: boolean;
  maxLength?: number;
}

/**
 * Título de uma linha na listagem do roteiro: descreve **o que se valida** (resultado esperado,
 * parâmetros ou suíte/ambiente), sem repetir o primeiro passo da ação.
 */
export function getTestCaseListTitle(
  testCase: TestCase,
  options: GetTestCaseListTitleOptions = {}
): string {
  const truncate = options.truncate !== false;
  const normalizeTitle = (value: string): string =>
    truncate ? clampListTitle(value, options.maxLength) : value.trim();
  const exp = testCase.expectedResult || '';

  if (!isPlaceholderOrEmptyExpected(exp)) {
    const lines = exp.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const firstBullet = lines.find(l => /^[•\-]\s*\S/.test(l));
    if (firstBullet) {
      const t = collapseOneLine(firstBullet.replace(/^[•\-]\s*/, ''));
      const c = normalizeTitle(t);
      if (c) return c;
    }

    const one = collapseOneLine(exp);
    const c = normalizeTitle(one);
    if (c) return c;
  }

  const params = (testCase.parameters || '').trim();
  if (params && params !== '—') {
    const c = normalizeTitle(collapseOneLine(params));
    if (c.length >= 8) return c;
  }

  const suite = getTestCaseSuite(testCase);
  if (suite) return normalizeTitle(`Teste — ${suite}`);
  const env = getTestCaseEnvironment(testCase);
  if (env) return normalizeTitle(`Teste — ${env}`);

  return 'Caso de teste';
}

/**
 * Resumo para stakeholders (PO): critério de aceite completo ou título da listagem.
 */
export function getTestCasePoSummary(testCase: TestCase): string {
  const expected = (testCase.expectedResult || '').trim();
  if (!isPlaceholderOrEmptyExpected(expected)) {
    return expected;
  }
  return getTestCaseListTitle(testCase, { truncate: false });
}

/**
 * Passos de execução condensados para relatórios (máx. N passos).
 */
export function getTestCaseActionSummary(testCase: TestCase, maxSteps = 3): string {
  const steps = parseTestCaseActionSteps(testCase.action || '');
  if (steps.length === 0) {
    return '';
  }
  const labels = steps.map(step => stripLeadingStepIndex(step)).filter(Boolean);
  if (labels.length <= maxSteps) {
    return labels.join('; ');
  }
  return `${labels.slice(0, maxSteps).join('; ')}…`;
}

/**
 * Linha de contexto (parâmetros, ambiente, suíte) para relatórios ao PO.
 */
export function getTestCaseContextLine(testCase: TestCase): string | null {
  const parts: string[] = [];
  const params = (testCase.parameters || '').trim();
  if (params && params !== '—') {
    parts.push(params);
  }
  const env = getTestCaseEnvironment(testCase);
  if (env && !/ambiente\s*:/i.test(params)) {
    parts.push(`Ambiente: ${env}`);
  }
  const suite = getTestCaseSuite(testCase);
  if (suite && !/suíte\s*:|suite\s*:/i.test(params)) {
    parts.push(`Suíte: ${suite}`);
  }
  if (parts.length === 0) {
    return null;
  }
  return collapseOneLine(parts.join(' · '));
}

/**
 * Normaliza texto de ação de caso de teste em passos para exibição.
 * Cobre listas numeradas em várias linhas e passos colados na mesma linha (ex.: "...'.2. Informe...").
 */
export function parseTestCaseActionSteps(action: string): string[] {
  const trimmed = (action || '').trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every(l => /^\d+\.\s/.test(l))) {
    return lines;
  }

  const byNumberedBreak = trimmed
    .split(/(?<=[.!?…])\s*(?=\d+\.\s)/)
    .map(s => s.trim())
    .filter(Boolean);

  if (byNumberedBreak.length > 1) {
    return byNumberedBreak;
  }

  return [trimmed];
}

/** Remove o prefixo "N. " do início do passo para usar com `<ol>` nativo. */
export function stripLeadingStepIndex(step: string): string {
  const next = step.replace(/^\d+\.\s*/, '').trim();
  return next || step.trim();
}

export interface ParameterRow {
  key: string;
  value: string;
}

export type RoteiroFieldView =
  | { kind: 'plain'; text: string }
  | { kind: 'ordered'; items: string[]; listStyle: 'decimal' | 'disc' }
  | { kind: 'parameters'; rows: ParameterRow[] };

/** Remove só o ponto de fechamento do segmento (não após parêntese, ex.: "etc.)."). */
function trimParameterSegmentValue(value: string): string {
  const t = value.trim();
  return t.replace(/(?<!\))\.$/, '');
}

function lineToParameterRow(line: string): ParameterRow | null {
  const m = line.match(/^([^:]+?):\s*(.+)$/s);
  if (!m) return null;
  const key = m[1].trim();
  const value = trimParameterSegmentValue(m[2]);
  if (!key) return null;
  return { key, value };
}

/**
 * Divide parâmetros em pares rótulo/valor (ex.: "Tela: 'x'. Nº da Guia: 'y'.")
 * ou em passos numerados quando o texto seguir o mesmo padrão da ação.
 */
export function structureTestCaseParameters(text: string): RoteiroFieldView {
  const trimmed = (text || '').trim();
  if (!trimmed) return { kind: 'plain', text: '—' };

  const asSteps = parseTestCaseActionSteps(trimmed);
  if (asSteps.length > 1) {
    return {
      kind: 'ordered',
      items: asSteps.map(s => stripLeadingStepIndex(s)),
      listStyle: 'decimal',
    };
  }

  const rows = parseParameterKeyValueRows(trimmed);
  if (rows && rows.length >= 1) {
    return { kind: 'parameters', rows };
  }

  return { kind: 'plain', text: trimmed };
}

function parseParameterKeyValueRows(trimmed: string): ParameterRow[] | null {
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    const rows = lines.map(lineToParameterRow).filter((r): r is ParameterRow => r !== null);
    if (rows.length === lines.length) return rows;
  }

  const segments = trimmed
    .split(/(?<=\.)\s+(?=[A-Za-zÀ-ÿ0-9"'«»(][^:.\n]{0,180}:)/)
    .map(s => s.trim())
    .filter(Boolean);

  if (segments.length === 0) return null;
  const rows = segments.map(lineToParameterRow).filter((r): r is ParameterRow => r !== null);
  if (rows.length === 0) return null;
  if (rows.length === segments.length) return rows;
  if (rows.length >= 2 && rows.length >= Math.ceil(segments.length * 0.85)) return rows;
  return null;
}

/** Quebra resultado esperado em cláusulas comuns em PT-BR após ponto final. */
function splitExpectedProseClauses(s: string): string[] {
  const parts = s
    .split(
      /(?<=[.!?…])\s+(?=(?:O|A|Os|As|Um|Uma|Não|Deve|É\b|Será|Caso|Se\b|Quando|Além|Ainda|Também|Porém|Contudo|Nenhum|Nenhuma|Garantir|Verificar|Assegurar)\b)/i
    )
    .map(c => c.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [s];
}

export function structureTestCaseExpected(text: string): RoteiroFieldView {
  const trimmed = (text || '').trim();
  if (!trimmed) return { kind: 'plain', text: '—' };

  const asSteps = parseTestCaseActionSteps(trimmed);
  if (asSteps.length > 1) {
    return {
      kind: 'ordered',
      items: asSteps.map(s => stripLeadingStepIndex(s)),
      listStyle: 'decimal',
    };
  }

  const clauses = splitExpectedProseClauses(trimmed);
  if (clauses.length > 1) {
    return { kind: 'ordered', items: clauses, listStyle: 'disc' };
  }

  return { kind: 'plain', text: trimmed };
}
