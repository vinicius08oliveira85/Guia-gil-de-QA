import { describe, expect, it } from 'vitest';
import { resolveHeaderBackNavigation } from '../../utils/headerBackNavigation';

describe('resolveHeaderBackNavigation', () => {
  it('retorna null na landing', () => {
    expect(resolveHeaderBackNavigation('/')).toBeNull();
  });

  it('volta para Projetos quando estiver em um projeto', () => {
    expect(resolveHeaderBackNavigation('/projects/abc-123')).toEqual({
      label: 'Projetos',
      targetPath: '/projects',
      ariaLabel: 'Voltar para Projetos',
    });
  });

  it('volta para o Menu na lista de projetos', () => {
    expect(resolveHeaderBackNavigation('/projects')).toEqual({
      label: 'Menu',
      targetPath: '/',
      ariaLabel: 'Voltar para o Menu',
    });
  });

  it('volta para o Menu no acompanhamento de tarefas', () => {
    expect(resolveHeaderBackNavigation('/jira-solus')).toEqual({
      label: 'Menu',
      targetPath: '/',
      ariaLabel: 'Voltar para o Menu',
    });
  });
});
