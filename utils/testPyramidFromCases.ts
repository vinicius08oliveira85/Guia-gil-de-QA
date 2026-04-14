import type { Project, TestCase, TestPyramidAnalysis } from '../types';

export type PyramidLevelName = 'Unitário' | 'Integração' | 'E2E';

const LEVELS: PyramidLevelName[] = ['Unitário', 'Integração', 'E2E'];

/** Converte strings como "70%" em número 0–100. */
export function parseEffortPercent(effort: string | undefined): number {
  if (!effort) return 0;
  const m = String(effort).match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(',', '.'));
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function normalizeStrategy(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Classifica um caso de teste em um nível da pirâmide com base em strategies / suite / descrição.
 * Padrão: Integração (maioria dos fluxos manuais).
 */
export function classifyTestCasePyramidLevel(tc: TestCase): PyramidLevelName {
  const parts = [...(tc.strategies || []), tc.testSuite || '', tc.title || '', tc.description || '']
    .filter(Boolean)
    .map((x) => normalizeStrategy(String(x)));

  const blob = parts.join(' ');

  const isUnit = parts.some((p) =>
    /\bunit\b|unitario|unitário|caixa branca|white box|componente isolado/.test(p)
  );
  const isE2e = parts.some((p) =>
    /\be2e\b|endtoend|end-to-end|aceitacao|aceitação|aceitacao|fluxo completo|jornada|uat|smoke global/.test(p) ||
    /teste e2e|e2e automatizado/.test(p)
  );

  if (isUnit && !isE2e) return 'Unitário';
  if (isE2e) return 'E2E';
  if (/integra|api|contrato|contract|servi[oç]o|mensageria|fila/.test(blob)) return 'Integração';
  if (/unit|unitario/.test(blob)) return 'Unitário';
  if (/e2e|aceitacao|aceita/.test(blob)) return 'E2E';
  return 'Integração';
}

export interface PyramidChartRow {
  level: PyramidLevelName;
  idealPercent: number;
  currentPercent: number;
  currentCount: number;
}

export function aggregateCurrentPyramidCounts(project: Project): Record<PyramidLevelName, number> {
  const counts: Record<PyramidLevelName, number> = { Unitário: 0, Integração: 0, E2E: 0 };
  for (const task of project.tasks || []) {
    for (const tc of task.testCases || []) {
      counts[classifyTestCasePyramidLevel(tc)]++;
    }
  }
  return counts;
}

/** Linhas para Recharts: ideal (IA) vs atual (% dos casos). */
export function buildPyramidComparisonRows(
  ideal: TestPyramidAnalysis | null | undefined,
  project: Project
): PyramidChartRow[] {
  const counts = aggregateCurrentPyramidCounts(project);
  const total = LEVELS.reduce((a, l) => a + counts[l], 0);

  const idealByLevel = new Map<PyramidLevelName, number>();
  for (const l of LEVELS) idealByLevel.set(l, 0);
  for (const item of ideal?.distribution || []) {
    const lvl = item.level as PyramidLevelName;
    if (LEVELS.includes(lvl)) {
      idealByLevel.set(lvl, parseEffortPercent(item.effort));
    }
  }

  return LEVELS.map((level) => {
    const currentCount = counts[level];
    const currentPercent = total > 0 ? Math.round((currentCount / total) * 1000) / 10 : 0;
    const idealPercent = idealByLevel.get(level) ?? 0;
    return { level, idealPercent, currentPercent, currentCount };
  });
}

