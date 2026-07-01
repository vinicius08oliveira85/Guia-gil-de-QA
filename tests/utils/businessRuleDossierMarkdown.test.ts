import { describe, expect, it } from 'vitest';
import { buildDossierMarkdown } from '../../utils/businessRuleDossierMarkdown';

describe('businessRuleDossierMarkdown', () => {
  it('buildDossierMarkdown monta seções principais', () => {
    const md = buildDossierMarkdown('RN-Teste', {
      executiveSummary: 'Resumo',
      asWas: 'Era',
      asIs: 'É',
      toBe: 'Será',
      components: [{ name: 'Grid', description: 'Grade', taskIds: ['T-1'] }],
      functionalities: [],
      integrations: [],
      traceability: [],
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
      executiveSummary: 'Resumo',
      asWas: 'Era',
      asIs: 'É',
      toBe: 'Será',
      components: [],
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
      integrations: [],
      traceability: [],
    });

    expect(md).toContain('## Funcionalidades');
    expect(md).toContain('### Mapa de Internação');
    expect(md).toContain('**Tasks:** GDPI-210, GDPI-215');
    expect(md).toContain('**Status:** Implementado');
    expect(md).toContain('**O que foi implementado:**');
    expect(md).toContain('Grid com colunas');
    expect(md).toContain('**Resultado esperado:**');
    expect(md).toContain('Enfermeiro visualiza');
  });
});
