import { describe, expect, it } from 'vitest';
import {
  mergeTaskSheetItem,
  mergeTaskSheetsForRefresh,
} from '../../utils/businessRuleDossierMerge';
import type { BusinessRuleTaskSheet } from '../../types';

const sheet = (
  taskId: string,
  implemented: string,
  purpose = 'Objetivo'
): BusinessRuleTaskSheet => ({
  taskId,
  taskTitle: taskId,
  implemented,
  legacyBefore: 'Antes',
  improvedAfter: 'Depois',
  purpose,
  integratedSystems: 'Sistema A',
  expectedResult: 'Resultado',
});

describe('businessRuleDossierMerge', () => {
  it('mergeTaskSheetItem preserva campo anterior quando incoming é placeholder', () => {
    const previous = sheet('GDPI-1', 'Implementação detalhada existente');
    const incoming = sheet('GDPI-1', '[A CONFIRMAR]');
    const merged = mergeTaskSheetItem(previous, incoming);
    expect(merged.implemented).toBe('Implementação detalhada existente');
  });

  it('mergeTaskSheetsForRefresh mantém fichas anteriores omitidas pela IA', () => {
    const previous = [sheet('GDPI-1', 'Conteúdo preservado'), sheet('GDPI-2', 'Outra ficha')];
    const incoming = [sheet('GDPI-3', 'Ficha nova')];
    const merged = mergeTaskSheetsForRefresh(previous, incoming, ['GDPI-1', 'GDPI-2', 'GDPI-3']);
    expect(merged.map(s => s.taskId)).toEqual(['GDPI-1', 'GDPI-2', 'GDPI-3']);
    expect(merged.find(s => s.taskId === 'GDPI-1')?.implemented).toBe('Conteúdo preservado');
    expect(merged.find(s => s.taskId === 'GDPI-3')?.implemented).toBe('Ficha nova');
  });

  it('mergeTaskSheetsForRefresh remove fichas de tasks desvinculadas', () => {
    const previous = [sheet('GDPI-1', 'A'), sheet('GDPI-2', 'B')];
    const merged = mergeTaskSheetsForRefresh(previous, [], ['GDPI-1']);
    expect(merged.map(s => s.taskId)).toEqual(['GDPI-1']);
  });
});
