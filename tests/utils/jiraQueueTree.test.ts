import { describe, expect, it } from 'vitest';
import { buildJiraQueueTree, parseJiraQueueName } from '../../utils/jiraQueueTree';
import type { JiraQueue } from '../../services/jira/types';

function makeQueue(id: string, name: string): JiraQueue {
  return { id, name, jql: `project = SUS AND queue = ${id}`, serviceDeskId: '1' };
}

describe('parseJiraQueueName', () => {
  it('extrai categoria de colchetes', () => {
    expect(parseJiraQueueName('Abertos [Governança]')).toEqual({
      category: 'Governança',
      label: 'Abertos',
    });
  });

  it('extrai categoria de parênteses', () => {
    expect(parseJiraQueueName('Abertos (Solus)')).toEqual({
      category: 'Solus',
      label: 'Abertos',
    });
  });

  it('coloca filas sem sufixo em Favoritos', () => {
    expect(parseJiraQueueName('Todas abertas')).toEqual({
      category: 'Favoritos',
      label: 'Todas abertas',
    });
  });
});

describe('buildJiraQueueTree', () => {
  it('agrupa filas por categoria no estilo sidebar do Jira', () => {
    const tree = buildJiraQueueTree([
      makeQueue('1', 'Todas abertas'),
      makeQueue('2', 'Minhas'),
      makeQueue('3', 'Abertos [Governança]'),
      makeQueue('4', 'Minhas [Governança]'),
      makeQueue('5', 'Abertos (Solus)'),
    ]);

    expect(tree.map(group => group.label)).toEqual(['Favoritos', 'Governança', 'Solus']);
    expect(tree[0].items.map(item => item.label)).toEqual(['Minhas', 'Todas abertas']);
    expect(tree[1].items.map(item => item.label)).toEqual(['Abertos', 'Minhas']);
    expect(tree[2].items.map(item => item.label)).toEqual(['Abertos']);
  });
});
