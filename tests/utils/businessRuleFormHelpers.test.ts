import { describe, expect, it } from 'vitest';
import {
  hasBusinessRuleMetadataChanges,
  saveBusinessRuleMetadata,
} from '../../utils/businessRuleFormHelpers';
import type { BusinessRule, Project } from '../../types';

const baseRule = (overrides: Partial<BusinessRule> = {}): BusinessRule => ({
  id: 'rule-1',
  title: 'RN-Teste',
  createdAt: '2026-01-01T00:00:00.000Z',
  linkedTaskIds: ['GDPI-1'],
  searchKeywords: ['Teste'],
  analysis: {
    version: 1,
    generatedAt: '2026-01-02T00:00:00.000Z',
    markdown: '# Dossiê',
    executiveSummary: 'Resumo',
    asWas: 'Era',
    asIs: 'É',
    toBe: 'Será',
    taskSheets: [],
    components: [],
    functionalities: [],
    integrations: [],
    traceability: [],
  },
  taskSnapshotHash: 'br-abc',
  ...overrides,
});

const project = (rule: BusinessRule): Project => ({
  id: 'p1',
  name: 'Projeto',
  tasks: [
    {
      id: 'GDPI-1',
      title: 'Task 1',
      description: 'Desc',
      status: 'Done',
      testCases: [],
      type: 'História',
    },
  ],
  businessRules: [rule],
});

describe('businessRuleFormHelpers', () => {
  it('hasBusinessRuleMetadataChanges detecta nova screenshot', () => {
    const rule = baseRule({ screenshots: [] });
    const changed = hasBusinessRuleMetadataChanges(rule, {
      title: rule.title,
      searchKeywords: rule.searchKeywords ?? [],
      linkedTaskIds: rule.linkedTaskIds,
      screenshots: [
        {
          id: 'shot-1',
          name: 'print.png',
          dataUrl: 'data:image/png;base64,abc',
          uploadedAt: '2026-01-03T00:00:00.000Z',
        },
      ],
    });
    expect(changed).toBe(true);
  });

  it('saveBusinessRuleMetadata marca dossiê como desatualizado quando tasks mudam', () => {
    const rule = baseRule();
    const result = saveBusinessRuleMetadata(project(rule), rule, {
      title: rule.title,
      searchKeywords: rule.searchKeywords ?? [],
      linkedTaskIds: ['GDPI-1', 'GDPI-2'],
      screenshots: [],
    });
    expect(result.rule.isOutdated).toBe(true);
    expect(result.markedOutdated).toBe(true);
    expect(result.rule.linkedTaskIds).toEqual(['GDPI-1', 'GDPI-2']);
    expect(result.rule.analysis?.version).toBe(1);
  });

  it('saveBusinessRuleMetadata cria regra nova sem análise', () => {
    const emptyProject: Project = {
      id: 'p1',
      name: 'Projeto',
      tasks: [],
      businessRules: [],
    };
    const result = saveBusinessRuleMetadata(emptyProject, null, {
      title: 'RN-Nova',
      searchKeywords: ['Nova'],
      linkedTaskIds: [],
      screenshots: [],
    });
    expect(result.project.businessRules).toHaveLength(1);
    expect(result.rule.title).toBe('RN-Nova');
    expect(result.rule.analysis).toBeUndefined();
  });
});
