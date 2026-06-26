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

  it('ignora filas sem sufixo de categoria (Favoritos no JSM)', () => {
    expect(parseJiraQueueName('Todas abertas')).toEqual({
      category: null,
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
      makeQueue('6', 'Abertos (APP)'),
    ]);

    expect(tree.map(group => group.label)).toEqual(['APP', 'Governança', 'Solus']);
    expect(tree[0].items.map(item => item.label)).toEqual(['Abertos']);
    expect(tree[1].items.map(item => item.label)).toEqual(['Abertos', 'Minhas']);
    expect(tree[2].items.map(item => item.label)).toEqual(['Abertos']);
  });

  it('retorna vazio quando só há filas globais sem categoria', () => {
    expect(
      buildJiraQueueTree([
        makeQueue('1', 'Todas abertas'),
        makeQueue('2', 'Minhas'),
      ])
    ).toEqual([]);
  });
});
