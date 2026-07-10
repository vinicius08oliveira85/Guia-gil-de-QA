import { describe, it, expect } from 'vitest';
import { parseTaskDescriptionForReport } from '../../utils/devReportTextStructure';
import { parseDevImplementationReportPreview } from '../../utils/devImplementationReportPreviewParse';
import { generateDevImplementationReport } from '../../utils/devImplementationReportGenerator';
import type { JiraTask } from '../../types';

describe('devReportTextStructure', () => {
  it('separa contexto e critérios de aceite', () => {
    const parsed = parseTaskDescriptionForReport(`
      Utilizar IA do Cursor para gerar o script.
      Critérios de Aceite:
      [ ] Fornecer JSONs mapeados
      [ ] Gerar código de autenticação
    `);

    expect(parsed.contextParagraphs[0]).toContain('Utilizar IA');
    expect(parsed.acceptanceCriteria).toHaveLength(2);
  });
});

describe('devImplementationReportPreviewParse', () => {
  it('interpreta metadados, passos e checklist', () => {
    const report = `
REGISTRO DE IMPLEMENTAÇÃO DEV

Tarefa: SIS-188
Ferramenta: Cursor AI (Agente)

CONTEXTO

Utilizar recursos de IA do Cursor.

CRITÉRIOS DE ACEITE

- [ ] Fornecer JSONs mapeados
- [ ] Gerar autenticação

Stack: Python · React

PASSOS DE IMPLEMENTAÇÃO (1/2 concluídos)

1. [CONCLUÍDO ✓] Criar script
   Descrição:
   Ler variáveis do .env
   Validações:
   - [x] Status 200

2. [PENDENTE ○] Listar chamados
`.trim();

    const rows = parseDevImplementationReportPreview(report);
    expect(rows.some(r => r.kind === 'meta' && r.label === 'Ferramenta')).toBe(true);
    expect(rows.some(r => r.kind === 'checklist')).toBe(true);
    expect(rows.filter(r => r.kind === 'step')).toHaveLength(2);
  });
});

describe('devImplementationReportGenerator structured output', () => {
  it('emite seções separadas para contexto e critérios', () => {
    const task: JiraTask = {
      id: 'SIS-1',
      title: 'API',
      description: 'Explorar API.\nCritérios de Aceite:\n[ ] Validar token',
      type: 'Tarefa',
      status: 'Done',
      testCases: [],
      devGuidance: {
        overview: 'Visão',
        prerequisites: [],
        implementationSteps: [
          { order: 1, title: 'Login', description: 'POST /login' },
        ],
        cursorAgentMasterPrompt: 'x',
      },
    };

    const report = generateDevImplementationReport(task, { mode: 'structured' });
    expect(report).toContain('CONTEXTO');
    expect(report).toContain('CRITÉRIOS DE ACEITE');
    expect(report).toContain('- [ ] Validar token');
    expect(report).not.toContain('Contexto: Explorar API');
  });
});
