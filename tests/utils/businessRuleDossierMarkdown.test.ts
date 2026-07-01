import { describe, expect, it } from 'vitest';
import { buildDossierMarkdown } from '../../utils/businessRuleDossierMarkdown';

const baseAnalysis = {
  executiveSummary: 'Resumo',
  asWas: 'Era',
  asIs: 'É',
  toBe: 'Será',
  components: [] as const,
  functionalities: [],
  taskSheets: [],
  integrations: [],
  traceability: [],
};

describe('businessRuleDossierMarkdown', () => {
  it('buildDossierMarkdown monta seções principais', () => {
    const md = buildDossierMarkdown('RN-Teste', {
      ...baseAnalysis,
      components: [{ name: 'Grid', description: 'Grade', taskIds: ['T-1'] }],
    });
    expect(md).toContain('# Dossiê: RN-Teste');
    expect(md).toContain('## Como era');
    expect(md).toContain('## Como está');
    expect(md).toContain('## Como será');
    expect(md).toContain('### Grid');
    expect(md).toContain('**Tasks:** T-1');
  });

  it('buildDossierMarkdown detalha funcionalidades com implementado e resultado esperado', () => {
    const md = buildDossierMarkdown('RN-Mapa', {
      ...baseAnalysis,
      functionalities: [
        {
          name: 'Mapa de Internação',
          description: 'Visualização do mapa diário',
          implemented:
            'Grid com colunas de leito, paciente e status [GDPI-210]. Filtro por unidade [GDPI-215].',
          expectedResult:
            'Enfermeiro visualiza ocupação atualizada e identifica leitos livres em tempo real.',
          taskIds: ['GDPI-210', 'GDPI-215'],
          implementationStatus: 'implementado',
        },
      ],
    });

    expect(md).toContain('## Funcionalidades');
    expect(md).toContain('### Mapa de Internação');
    expect(md).toContain('**O que foi implementado:**');
    expect(md).toContain('**Resultado esperado:**');
  });

  it('buildDossierMarkdown renderiza ficha técnica por task', () => {
    const md = buildDossierMarkdown('RN-Mapa', {
      ...baseAnalysis,
      taskSheets: [
        {
          taskId: 'GDPI-134',
          taskTitle: 'Alta e Motivo da Alta',
          implemented: 'Campos de alta no resumo clínico do mapa.',
          legacyBefore: 'Alta registrada fora do mapa.',
          improvedAfter: 'Alta e motivo no mesmo fluxo do mapa.',
          purpose: 'Registrar alta com motivo rastreável.',
          integratedSystems: 'Módulo Mapa de Internação, Resumo Clínico',
          expectedResult: 'Dados persistidos e visíveis no mapa após salvar.',
        },
      ],
    });

    expect(md).toContain('## Fichas técnicas por task');
    expect(md).toContain('### Ficha Técnica da Task: GDPI-134');
    expect(md).toContain('**Identificação (Jira):** GDPI-134');
    expect(md).toContain('**O que foi feito e implementado:**');
    expect(md).toContain('**Como era antes (Legado):**');
    expect(md).toContain('**Como ficou agora (Melhoria):**');
    expect(md).toContain('**O que a função faz:**');
    expect(md).toContain('**Sistemas/Módulos integrados:**');
    expect(md).toContain('**Resultado esperado:**');
  });
});
