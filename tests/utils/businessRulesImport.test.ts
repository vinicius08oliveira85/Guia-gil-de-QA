import { describe, it, expect } from 'vitest';
import {
  mergeBusinessRulesInto,
  parseBusinessRulesImportJson,
  validateBusinessRulesImportEnvelope,
} from '../../utils/businessRulesImport';
import {
  BUSINESS_RULES_EXPORT_FORMAT_ID,
  BUSINESS_RULES_IMPORT_MAX_FORMAT_VERSION,
} from '../../utils/businessRulesExportEnvelope';
import type { BusinessRule } from '../../types';

describe('parseBusinessRulesImportJson', () => {
  it('aceita formato export', () => {
    const json = JSON.stringify({
      projectName: 'P',
      exportedAt: 'x',
      businessRules: [{ id: 'a', title: 'T', description: 'D', createdAt: '2020-01-01' }],
    });
    const r = parseBusinessRulesImportJson(json);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rules).toHaveLength(1);
      expect(r.rules[0]?.category).toBe('Geral');
      expect(r.sourceProject).toBe('P');
      expect(r.skipped).toBe(0);
    }
  });

  it('aceita array direto', () => {
    const json = JSON.stringify([
      { id: 'b', title: 'X', description: '', createdAt: '', category: 'UX' },
    ]);
    const r = parseBusinessRulesImportJson(json);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rules[0]?.id).toBe('b');
      expect(r.rules[0]?.category).toBe('UX');
      expect(r.rules[0]?.createdAt).toMatch(/\d{4}/);
    }
  });

  it('rejeita JSON inválido', () => {
    expect(parseBusinessRulesImportJson('{').ok).toBe(false);
  });

  it('rejeita format incorreto quando informado', () => {
    const json = JSON.stringify({
      format: 'outro-formato',
      businessRules: [{ id: 'a', title: 'T', description: '', createdAt: '2020-01-01' }],
    });
    const r = parseBusinessRulesImportJson(json);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('não reconhecido');
  });

  it('rejeita formatVersion acima do suportado', () => {
    const json = JSON.stringify({
      format: BUSINESS_RULES_EXPORT_FORMAT_ID,
      formatVersion: BUSINESS_RULES_IMPORT_MAX_FORMAT_VERSION + 1,
      businessRules: [{ id: 'a', title: 'T', description: '', createdAt: '2020-01-01' }],
    });
    const r = parseBusinessRulesImportJson(json);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('formatVersion');
  });

  it('aceita envelope exportado com format e formatVersion suportados', () => {
    const json = JSON.stringify({
      format: BUSINESS_RULES_EXPORT_FORMAT_ID,
      formatVersion: BUSINESS_RULES_IMPORT_MAX_FORMAT_VERSION,
      businessRules: [{ id: 'a', title: 'T', description: '', createdAt: '2020-01-01' }],
    });
    const r = parseBusinessRulesImportJson(json);
    expect(r.ok).toBe(true);
  });
});

describe('validateBusinessRulesImportEnvelope', () => {
  it('retorna null sem campo format', () => {
    expect(validateBusinessRulesImportEnvelope({ businessRules: [] })).toBeNull();
  });

  it('retorna null com format válido e sem formatVersion', () => {
    expect(
      validateBusinessRulesImportEnvelope({
        format: BUSINESS_RULES_EXPORT_FORMAT_ID,
        businessRules: [],
      })
    ).toBeNull();
  });

  it('rejeita formatVersion não inteiro', () => {
    const err = validateBusinessRulesImportEnvelope({
      format: BUSINESS_RULES_EXPORT_FORMAT_ID,
      formatVersion: 1.2,
      businessRules: [],
    });
    expect(err).toContain('inteiro');
  });
});

describe('mergeBusinessRulesInto', () => {
  const e: BusinessRule[] = [
    { id: '1', title: 'A', description: 'a', category: 'Geral', createdAt: 't1' },
  ];

  it('adiciona novas ao final', () => {
    const incoming: BusinessRule[] = [
      { id: '2', title: 'B', description: 'b', category: 'Geral', createdAt: 't2' },
    ];
    const { merged, addedCount, updatedCount } = mergeBusinessRulesInto(e, incoming);
    expect(addedCount).toBe(1);
    expect(updatedCount).toBe(0);
    expect(merged.map(r => r.id)).toEqual(['1', '2']);
  });

  it('atualiza por id e preserva ordem', () => {
    const incoming: BusinessRule[] = [
      { id: '1', title: 'A2', description: 'a2', category: 'Segurança', createdAt: 't99' },
    ];
    const { merged, addedCount, updatedCount } = mergeBusinessRulesInto(e, incoming);
    expect(updatedCount).toBe(1);
    expect(addedCount).toBe(0);
    expect(merged[0]?.title).toBe('A2');
    expect(merged[0]?.category).toBe('Segurança');
    expect(merged[0]?.createdAt).toBe('t1');
  });
});
