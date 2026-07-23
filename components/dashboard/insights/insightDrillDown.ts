import type { BugSeverity } from '../../../types';

/** Payload de drill-down dos cards de insight → aba Tarefas. */
export type InsightDrillDownKind = 'severity' | 'module';

export interface InsightDrillDownPayload {
  kind: InsightDrillDownKind;
  /** Severidade (`BugSeverity`) ou label de módulo. */
  value: string;
}

export function isBugSeverity(value: string): value is BugSeverity {
  return value === 'Crítico' || value === 'Alto' || value === 'Médio' || value === 'Baixo';
}
