import { describe, it, expect } from 'vitest';
import type { Project } from '../../types';
import { normalizeProjectBusinessRules } from '../../utils/businessRuleDefaults';
import {
  addCategoryPreset,
  businessRuleCategoryLabel,
  DEFAULT_BUSINESS_RULE_CATEGORY_PRESETS,
  effectiveCategoryPresets,
  getMergedBusinessRuleCategories,
  removeCategoryPreset,
  renameCategoryPreset,
} from '../../utils/businessRuleCategoryPresets';

const baseProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'P',
  description: '',
  documents: [],
  businessRules: [],
  tasks: [],
  phases: [],
  ...overrides,
});

describe('businessRuleCategoryPresets', () => {
  it('effectiveCategoryPresets usa padrão quando undefined', () => {
    const p = baseProject();
    expect(effectiveCategoryPresets(p).length).toBeGreaterThan(0);
    expect(effectiveCategoryPresets(p)).toContain('Geral');
  });

  it('effectiveCategoryPresets usa padrão quando array vazio', () => {
    const p = baseProject({ businessRuleCategoryPresets: [] });
    expect(effectiveCategoryPresets(p)).toEqual([...DEFAULT_BUSINESS_RULE_CATEGORY_PRESETS]);
  });

  it('effectiveCategoryPresets respeita lista explícita', () => {
    const p = baseProject({ businessRuleCategoryPresets: ['A', 'B'] });
    expect(effectiveCategoryPresets(p)).toEqual(['A', 'B']);
  });

  it('getMergedBusinessRuleCategories une presets e regras', () => {
    const p = baseProject({
      businessRuleCategoryPresets: ['Preset'],
      businessRules: [
        { id: '1', title: 't', description: '', category: 'DaRegra', createdAt: '2020-01-01' },
      ],
    });
    const merged = getMergedBusinessRuleCategories(p, p.businessRules);
    expect(merged).toContain('Preset');
    expect(merged).toContain('DaRegra');
  });

  it('addCategoryPreset rejeita duplicata e vazio', () => {
    const p = baseProject({ businessRuleCategoryPresets: ['X'] });
    expect(addCategoryPreset(p, '  ').error).toBe('empty');
    expect(addCategoryPreset(p, 'X').error).toBe('duplicate');
    expect(addCategoryPreset(p, 'x').error).toBe('duplicate');
    const ok = addCategoryPreset(p, 'Y');
    expect(ok.error).toBeUndefined();
    expect(ok.project.businessRuleCategoryPresets).toContain('Y');
  });

  it('renameCategoryPreset atualiza regras e presets', () => {
    const p = baseProject({
      businessRuleCategoryPresets: ['Velho', 'Outro'],
      businessRules: [
        { id: '1', title: 't', description: '', category: 'Velho', createdAt: '2020-01-01' },
      ],
    });
    const { project: next, error } = renameCategoryPreset(p, 'Velho', 'Novo');
    expect(error).toBeUndefined();
    expect(next.businessRuleCategoryPresets).toContain('Novo');
    expect(next.businessRuleCategoryPresets).not.toContain('Velho');
    expect(businessRuleCategoryLabel(next.businessRules[0])).toBe('Novo');
  });

  it('removeCategoryPreset remove só da lista', () => {
    const p = baseProject({
      businessRuleCategoryPresets: ['A', 'B'],
    });
    const next = removeCategoryPreset(p, 'A');
    expect(next.businessRuleCategoryPresets).toEqual(['B']);
  });

  it('removeCategoryPreset ao esvaziar lista remove o campo (volta ao implícito undefined)', () => {
    const p = baseProject({ businessRuleCategoryPresets: ['SóEsta'] });
    const next = removeCategoryPreset(p, 'SóEsta');
    expect(next.businessRuleCategoryPresets).toBeUndefined();
  });

  it('normalizeProjectBusinessRules remove array vazio de presets', () => {
    const p = baseProject({ businessRuleCategoryPresets: [] });
    const n = normalizeProjectBusinessRules(p);
    expect(n.businessRuleCategoryPresets).toBeUndefined();
  });
});
