import { describe, expect, it } from 'vitest';
import {
  normalizeFunctionalityItem,
  normalizeFunctionalityItems,
  normalizeTaskSheetItem,
} from '../../utils/businessRuleDossierNormalize';

describe('businessRuleDossierNormalize', () => {
  it('normalizeFunctionalityItem preenche campos obrigatórios', () => {
    const item = normalizeFunctionalityItem({
      name: 'Foto do dia',
      description: 'Resumo curto',
      implemented: 'Grid com colunas X e Y',
      expectedResult: 'Usuário visualiza foto atualizada',
      taskIds: ['GDPI-210'],
      implementationStatus: 'implementado',
    });

    expect(item.implemented).toBe('Grid com colunas X e Y');
    expect(item.expectedResult).toBe('Usuário visualiza foto atualizada');
    expect(item.implementationStatus).toBe('implementado');
  });

  it('normalizeFunctionalityItem usa description como fallback de implemented', () => {
    const item = normalizeFunctionalityItem({
      name: 'Legado',
      description: 'Descrição antiga da funcionalidade',
      taskIds: [],
    });

    expect(item.implemented).toBe('Descrição antiga da funcionalidade');
    expect(item.expectedResult).toBe('[A CONFIRMAR]');
  });

  it('normalizeFunctionalityItems normaliza lista', () => {
    const items = normalizeFunctionalityItems([
      { name: 'A', description: 'd', implemented: 'i', expectedResult: 'e', taskIds: [] },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('A');
  });
});

describe('normalizeTaskSheetItems', () => {
  it('preenche campos obrigatórios da ficha técnica', () => {
    const sheet = normalizeTaskSheetItem({
      taskId: 'GDPI-1',
      taskTitle: 'Sincronização',
      implemented: 'Sync de dados',
      legacyBefore: 'Manual',
      improvedAfter: 'Automático',
      purpose: 'Manter mapa atualizado',
      integratedSystems: 'API internação',
      expectedResult: 'Dados consistentes',
    });
    expect(sheet.taskId).toBe('GDPI-1');
    expect(sheet.expectedResult).toBe('Dados consistentes');
  });
});
