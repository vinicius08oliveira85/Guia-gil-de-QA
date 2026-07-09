import { describe, expect, it } from 'vitest';
import { resolveHeaderBackNavigation } from '../../utils/headerBackNavigation';

describe('resolveHeaderBackNavigation', () => {
  it('retorna null na landing', () => {
    expect(resolveHeaderBackNavigation('/')).toBeNull();
  });

  it('volta para Projetos QA quando estiver em um projeto QA', () => {
    expect(
      resolveHeaderBackNavigation('/projects/abc-123', { projectWorkflow: 'qa' })
    ).toEqual({
      label: 'Projetos QA',
      targetPath: '/projects/qa',
      ariaLabel: 'Voltar para Projetos QA',
    });
  });

  it('volta para Projetos Dev quando estiver em um projeto Dev', () => {
    expect(
      resolveHeaderBackNavigation('/projects/abc-123', { projectWorkflow: 'dev' })
    ).toEqual({
      label: 'Projetos Dev',
      targetPath: '/projects/dev',
      ariaLabel: 'Voltar para Projetos Dev',
    });
  });

  it('volta para o Menu na lista de projetos QA', () => {
    expect(resolveHeaderBackNavigation('/projects/qa')).toEqual({
      label: 'Menu',
      targetPath: '/',
      ariaLabel: 'Voltar para o Menu',
    });
  });

  it('volta para o Menu na lista de projetos Dev', () => {
    expect(resolveHeaderBackNavigation('/projects/dev')).toEqual({
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
