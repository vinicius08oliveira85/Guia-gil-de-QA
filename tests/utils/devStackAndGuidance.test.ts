import { describe, expect, it } from 'vitest';
import { devStackIsConfigured, normalizeDevStackConfig } from '../../utils/devStackPresets';
import { formatDevStackForPrompt } from '../../utils/devStackFormat';
import { devGuidanceToMarkdown } from '../../utils/devGuidanceExport';
import type { DevGuidanceArtifact } from '../../types';

describe('devStackPresets', () => {
  it('normaliza stack vazia', () => {
    expect(normalizeDevStackConfig(undefined).languages).toEqual([]);
    expect(devStackIsConfigured(undefined)).toBe(false);
  });

  it('detecta stack configurada', () => {
    expect(
      devStackIsConfigured({
        languages: ['TypeScript'],
        frameworks: [],
        databases: [],
        tools: [],
      })
    ).toBe(true);
  });
});

describe('devStackFormat', () => {
  it('formata stack para prompt', () => {
    const text = formatDevStackForPrompt({
      languages: ['TypeScript'],
      frameworks: ['React'],
      databases: [],
      tools: [],
    });
    expect(text).toContain('TypeScript');
    expect(text).toContain('React');
  });
});

describe('devGuidanceExport', () => {
  it('exporta guia em markdown', () => {
    const guidance: DevGuidanceArtifact = {
      overview: 'Visão geral do fluxo.',
      prerequisites: ['Configurar .env'],
      cursorAgentMasterPrompt: 'Implemente o cadastro completo no projeto.',
      implementationSteps: [
        {
          order: 1,
          title: 'Criar endpoint',
          description: 'Implementar POST /api/items',
          filesOrModules: ['src/routes/items.ts'],
          cursorAgentAction: 'create',
          cursorAgentPrompt: 'Crie o endpoint POST /api/items em src/routes/items.ts.',
        },
      ],
    };
    const md = devGuidanceToMarkdown({ id: 'TASK-1', title: 'Cadastro' }, guidance);
    expect(md).toContain('# Guia de implementação — Cadastro');
    expect(md).toContain('Criar endpoint');
    expect(md).toContain('src/routes/items.ts');
    expect(md).toContain('Prompt mestre — Agente do Cursor');
    expect(md).toContain('Crie o endpoint POST /api/items');
  });
});

describe('cursorAgentUi', () => {
  it('normaliza ação do agente', async () => {
    const { normalizeCursorAgentAction } = await import('../../utils/cursorAgentUi');
    expect(normalizeCursorAgentAction('modify')).toBe('modify');
    expect(normalizeCursorAgentAction('invalid')).toBe('create');
  });
});
